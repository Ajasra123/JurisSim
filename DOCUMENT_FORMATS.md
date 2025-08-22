# Supported Document Formats

## Overview
The AI Courtroom Simulator accepts legal documents in the following formats for analysis and simulation:

## Supported File Types

### 1. PDF Files (.pdf)
- **Format**: Portable Document Format
- **Size Limit**: 10MB maximum
- **Requirements**: Must contain searchable text (not scanned images)
- **Use Cases**: 
  - Court filings
  - Legal briefs
  - Case law documents
  - Contracts and agreements
  - Expert reports
  - Witness statements

### 2. Text Files (.txt)
- **Format**: Plain text
- **Size Limit**: 10MB maximum
- **Encoding**: UTF-8 preferred
- **Use Cases**:
  - Transcripts
  - Notes and summaries
  - Simple legal documents
  - Case outlines

## Document Processing

### Text Extraction
- **PDF**: Advanced text extraction using pdf-parse library
- **TXT**: Direct text reading with UTF-8 encoding
- **Chunking**: Documents are automatically split into 900-character chunks with 120-character overlap for AI processing

### Content Analysis
The system analyzes uploaded documents for:
- Legal terminology and concepts
- Case facts and evidence
- Relevant legal precedents
- Key arguments and positions

## Best Practices

### Document Quality
1. **Clear Text**: Ensure PDFs contain selectable text, not scanned images
2. **Proper Formatting**: Use standard legal document formatting
3. **Complete Content**: Include all relevant sections (facts, arguments, evidence)
4. **File Size**: Keep files under 10MB for optimal processing

### Legal Document Types
The simulator works best with:
- **Criminal Cases**: Indictments, police reports, witness statements
- **Civil Cases**: Complaints, answers, motions, discovery documents
- **Contract Disputes**: Contracts, correspondence, breach allegations
- **Constitutional Cases**: Constitutional challenges, amicus briefs

### Content Guidelines
- **Factual Information**: Include clear statements of facts
- **Legal Issues**: Identify key legal questions and arguments
- **Evidence**: Reference specific evidence and documentation
- **Citations**: Include relevant case law and statutes when applicable

## Sample Document Structure

### Criminal Case Example
```
CASE TITLE: People v. [Defendant Name]

FACTS:
[Clear statement of alleged criminal conduct]

CHARGES:
[Specific criminal charges with statute references]

EVIDENCE:
[List of evidence including documents, witnesses, physical evidence]

LEGAL ISSUES:
[Key legal questions to be resolved]
```

### Civil Case Example
```
CASE TITLE: [Plaintiff] v. [Defendant]

PARTIES:
[Description of parties and their relationship]

FACTS:
[Chronological statement of relevant facts]

CLAIMS:
[Legal claims being asserted]

DAMAGES:
[Alleged harm and requested relief]

DEFENSES:
[Anticipated defenses and counterarguments]
```

## Troubleshooting

### Common Issues
1. **"No extractable text found"**: PDF may be a scanned image - try converting to searchable PDF
2. **"File too large"**: Reduce file size or split into multiple documents
3. **"Unsupported file type"**: Only PDF and TXT files are accepted
4. **Poor simulation quality**: Ensure documents contain sufficient factual and legal content

### File Preparation Tips
- Use OCR software for scanned documents
- Remove unnecessary formatting and images
- Focus on substantive legal content
- Include complete fact patterns and legal arguments

## Educational Use Notice
This simulator is designed for educational purposes only. All simulations are AI-generated and do not constitute legal advice or actual legal proceedings.