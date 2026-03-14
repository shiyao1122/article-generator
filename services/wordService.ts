import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import * as FileSaver from "file-saver";
import MarkdownIt from "markdown-it";

// Initialize parser with default settings
const md = new MarkdownIt();

/**
 * Processes inline markdown tokens (text, bold, italic) into docx TextRuns.
 */
const processInline = (tokens: any[], isHeading: boolean): TextRun[] => {
  const runs: TextRun[] = [];
  let isBold = false;
  let isItalic = false;

  for (const token of tokens) {
    if (token.type === 'text') {
      runs.push(new TextRun({
        text: token.content,
        bold: isBold,
        italics: isItalic,
        size: isHeading ? undefined : 24, // 24 half-points = 12pt for body
      }));
    } else if (token.type === 'code_inline') {
       runs.push(new TextRun({
        text: token.content,
        font: "Courier New",
        size: isHeading ? undefined : 22,
      }));
    } else if (token.type === 'strong_open') {
      isBold = true;
    } else if (token.type === 'strong_close') {
      isBold = false;
    } else if (token.type === 'em_open') {
      isItalic = true;
    } else if (token.type === 'em_close') {
      isItalic = false;
    } else if (token.type === 'softbreak') {
        // Treat softbreaks as a space to avoid running words together
        runs.push(new TextRun({ text: " " }));
    }
  }
  return runs;
};

export const generateWordBlob = async (title: string, content: string): Promise<Blob> => {
  // Parse content using markdown-it to get a stream of tokens
  const tokens = md.parse(content, {});
  const docChildren: Paragraph[] = [];
  
  // State tracking for the parser loop
  let listLevel = -1;
  let currentHeadingLevel: number | null = null;
  
  for (const token of tokens) {
    // Handle List Levels
    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      listLevel++;
    } else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
      listLevel--;
    } 
    // Handle Headings
    else if (token.type === 'heading_open') {
      const tagLevel = parseInt(token.tag.replace('h', ''), 10);
      currentHeadingLevel = tagLevel;
    } else if (token.type === 'heading_close') {
      currentHeadingLevel = null;
    } 
    // Handle Content (Inline tokens contain the actual text/formatting)
    else if (token.type === 'inline') {
      // Inline tokens occur inside paragraph_open or heading_open blocks.
      // We process the children of the inline token to get TextRuns.
      
      const runs = processInline(token.children || [], currentHeadingLevel !== null);
      
      // Skip empty runs to avoid empty paragraphs if not desired, 
      // though sometimes blank lines are intentional.
      if (runs.length === 0) continue;

      let paragraphOptions: any = {
        children: runs,
        spacing: { after: 100 }
      };

      // Apply specific styles based on context
      if (currentHeadingLevel !== null) {
        // Heading Styles
        switch (currentHeadingLevel) {
          case 1: 
            paragraphOptions.heading = HeadingLevel.HEADING_1; 
            paragraphOptions.spacing = { before: 300, after: 150 }; 
            break;
          case 2: 
            paragraphOptions.heading = HeadingLevel.HEADING_2; 
            paragraphOptions.spacing = { before: 240, after: 120 }; 
            break;
          case 3: 
            paragraphOptions.heading = HeadingLevel.HEADING_3; 
            paragraphOptions.spacing = { before: 200, after: 100 }; 
            break;
          case 4: paragraphOptions.heading = HeadingLevel.HEADING_4; break;
          case 5: paragraphOptions.heading = HeadingLevel.HEADING_5; break;
          case 6: paragraphOptions.heading = HeadingLevel.HEADING_6; break;
          default: paragraphOptions.heading = HeadingLevel.HEADING_1;
        }
      } else if (listLevel >= 0) {
        // List Item Styles
        // Note: nesting levels in docx are 0-based
        paragraphOptions.bullet = { level: listLevel };
      }

      docChildren.push(new Paragraph(paragraphOptions));
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 }
        }),
        ...docChildren
      ],
    }],
  });

  return await Packer.toBlob(doc);
};

export const downloadAsWordDoc = async (title: string, content: string) => {
  const blob = await generateWordBlob(title, content);
  
  // Robustly handle different export structures for file-saver in browser ESM
  // @ts-ignore
  const save = FileSaver.saveAs || FileSaver.default || FileSaver;
  
  save(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
};

export const generateMarkdownBlob = (content: string): Blob => {
  return new Blob([content], { type: "text/markdown;charset=utf-8" });
};

export const downloadAsMarkdown = (title: string, content: string) => {
  const blob = generateMarkdownBlob(content);
  
  // Robustly handle different export structures for file-saver in browser ESM
  // @ts-ignore
  const save = FileSaver.saveAs || FileSaver.default || FileSaver;
  
  save(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
};