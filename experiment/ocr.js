import Tesseract from 'tesseract.js';

Tesseract.recognize(
    './food-list.png',
  'jpn',
  { logger: m => console.log(m) }
).then(({ data }) => {
  console.log(data);
})