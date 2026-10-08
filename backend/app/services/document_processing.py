import io
import re

import pypdfium2
import pytesseract
from PIL import Image
from pytesseract import Output

MAX_PDF_PAGES = 5
PDF_RENDER_SCALE = 2
FIELDS = {
    "survey_number": r"survey(?:\s*(?:no\.?|number))?",
    "khata_number": r"khata(?:\s*(?:no\.?|number))?",
    "khasra_number": r"khasra(?:\s*(?:no\.?|number))?",
    "owner_name": r"(?:owner|account\s*holder)(?:\s*name)?",
    "village_name": r"village(?:\s*name)?",
    "district": r"district",
}


def document_images(content: bytes, content_type: str):
    if content_type == "application/pdf":
        pdf = pypdfium2.PdfDocument(content)
        try:
            if len(pdf) > MAX_PDF_PAGES:
                raise ValueError(f"Documents are limited to {MAX_PDF_PAGES} PDF pages")
            for index in range(len(pdf)):
                page = pdf[index]
                width, height = page.get_size()
                if width * height * PDF_RENDER_SCALE**2 > 40_000_000:
                    raise ValueError("Each document page must be 40 megapixels or smaller")
                bitmap = page.render(scale=PDF_RENDER_SCALE)
                image = bitmap.to_pil().convert("RGB")
                if image.width * image.height > 40_000_000:
                    raise ValueError("Each document page must be 40 megapixels or smaller")
                yield image
        finally:
            pdf.close()
    else:
        with Image.open(io.BytesIO(content)) as source:
            if source.format not in {"JPEG", "PNG"}:
                raise ValueError("Only JPEG and PNG images are supported")
            source.verify()
        with Image.open(io.BytesIO(content)) as source:
            if source.width * source.height > 40_000_000:
                raise ValueError("Images must be 40 megapixels or smaller")
            yield source.convert("RGB")


def _ocr_lines(image: Image.Image):
    data = pytesseract.image_to_data(image, output_type=Output.DICT, timeout=25)
    lines = {}
    for index, word in enumerate(data["text"]):
        word = word.strip()
        try:
            confidence = float(data["conf"][index])
        except (TypeError, ValueError):
            continue
        if word and confidence >= 0:
            key = (data["page_num"][index], data["block_num"][index], data["par_num"][index], data["line_num"][index])
            line = lines.setdefault(key, {"words": [], "confidences": []})
            line["words"].append(word)
            line["confidences"].append(confidence)
    return [
        (" ".join(line["words"]), sum(line["confidences"]) / len(line["confidences"]))
        for line in lines.values()
    ]


def extract_land_fields(content: bytes, content_type: str):
    lines = []
    for image in document_images(content, content_type):
        lines.extend(_ocr_lines(image))
    if not lines:
        raise ValueError("No readable text was found in this document")

    extracted = {}
    confidence = {}
    for field, label in FIELDS.items():
        matcher = re.compile(rf"^\s*{label}\s*(?:no\.?|number)?\s*[:#=\-]\s*(.+?)\s*$", re.IGNORECASE)
        for line, score in lines:
            match = matcher.match(line)
            if match:
                value = match.group(1).strip(" \t:;,.")
                if value:
                    extracted[field] = value[:240]
                    confidence[field] = round(max(0.0, min(score, 100.0)), 1)
                    break

    average = round(sum(score for _, score in lines) / len(lines), 1)
    return extracted, confidence, average


def create_verification_score(extracted: dict, average_ocr_confidence: float):
    required_fields = tuple(FIELDS)
    present_count = sum(bool(extracted.get(field)) for field in required_fields)
    completeness_points = round((present_count / len(required_fields)) * 25)
    ocr_points = round(max(0.0, min(average_ocr_confidence, 100.0)) * 0.25)
    identifier_points = 0
    ownership_points = 0
    score = completeness_points + ocr_points + identifier_points + ownership_points
    reasons = []
    for field, label in (
        ("survey_number", "Survey Number"),
        ("khata_number", "Khata Number"),
        ("khasra_number", "Khasra Number"),
        ("owner_name", "Owner Name"),
        ("village_name", "Village Name"),
        ("district", "District"),
    ):
        if not extracted.get(field):
            reasons.append(f"Missing {label}")
    if average_ocr_confidence < 70:
        reasons.append("Low OCR Confidence")
    reasons.extend(["Identifier Match unavailable: no official registry connection", "Ownership Match unavailable: no official registry connection"])
    return score, {
        "identifier_match": {"points": identifier_points, "out_of": 25, "status": "unavailable"},
        "ownership_match": {"points": ownership_points, "out_of": 25, "status": "unavailable"},
        "document_completeness": {"points": completeness_points, "out_of": 25},
        "ocr_confidence": {"points": ocr_points, "out_of": 25, "percent": average_ocr_confidence},
    }, reasons
