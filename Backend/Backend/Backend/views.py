from rest_framework.decorators import api_view
from rest_framework.response import Response
from time import sleep
from utils.speech_to_text import speech_to_text

# @api_view(['POST'])
def analyze_questionnaire(request):
    # Simulate processing delay
    sleep(2)
    print("yeta aayo")
    # Mocked response
    results = {
        "totalQuestions": 15,
        "answeredQuestions": 15,
        "confidence": {
            "high": 9,
            "medium": 4,
            "low": 2,
        },
        "questions": [
            {
                "id": "Q1",
                "question": "Does your organization have a documented information security policy?",
                "suggestedAnswer": "Yes, our organization maintains a comprehensive Information Security Policy that is reviewed annually and approved by executive leadership.",
                "confidence": "high",
                "references": [
                    "InfoSec Policy v3.2, Section 1.1",
                    "ISO 27001 Certification Document"
                ]
            },
            {
                "id": "Q2",
                "question": "How often does your organization perform penetration testing?",
                "suggestedAnswer": "Our organization conducts penetration testing on a quarterly basis, with results reviewed by the security team and remediation plans implemented within 30 days.",
                "confidence": "high",
                "references": [
                    "Security Testing Procedure, Section 4.2",
                    "Last Penetration Test Report (March 2025)"
                ]
            },
            {
                "id": "Q3",
                "question": "Describe your organization's incident response plan.",
                "suggestedAnswer": "Our incident response plan follows NIST guidelines with defined roles, communication procedures, and containment strategies. The plan is tested bi-annually through tabletop exercises.",
                "confidence": "medium",
                "references": ["Incident Response Plan v2.1", "IR Exercise Reports"]
            },
            {
                "id": "Q4",
                "question": "What encryption standards are used for data at rest?",
                "suggestedAnswer": "We implement AES-256 encryption for all data at rest, with keys managed through a dedicated key management system with rotation policies.",
                "confidence": "low",
                "references": ["Encryption Policy, Section 3.4"]
            }
        ]
    }
    return Response(results)