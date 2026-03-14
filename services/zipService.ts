import JSZip from 'jszip';
import * as FileSaver from "file-saver";
import { generateWordBlob, generateMarkdownBlob } from './wordService';
import { ArticleData } from '../types';

export const downloadBatchAsZip = async (rows: ArticleData[], format: 'docx' | 'md' = 'docx') => {
  const zip = new JSZip();
  const folder = zip.folder("articles");
  
  if (!folder) return;

  const promises = rows.map(async (row) => {
    if (!row.finalArticle) return;

    const safeTitle = row.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    if (format === 'docx') {
      const blob = await generateWordBlob(row.topic, row.finalArticle);
      folder.file(`${safeTitle}.docx`, blob);
    } else {
      const blob = generateMarkdownBlob(row.finalArticle);
      folder.file(`${safeTitle}.md`, blob);
    }
  });

  await Promise.all(promises);

  const content = await zip.generateAsync({ type: "blob" });
  
  // Robustly handle different export structures for file-saver
  // @ts-ignore
  const save = FileSaver.saveAs || FileSaver.default || FileSaver;
  
  save(content, `articles_batch_${new Date().toISOString().slice(0, 10)}.zip`);
};