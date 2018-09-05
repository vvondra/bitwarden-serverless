/**

multipart.js

MIT License

Copyright (c) 2017 Anton Myshenin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

const prefixBoundary = '\r\n--';
const delimData = '\r\n\r\n';

function getValueIgnoringKeyCase(object, key) {
  const foundKey = Object.keys(object)
    .find(currentKey => currentKey.toLocaleLowerCase() === key.toLowerCase());

  return object[foundKey];
}

const defaultResult = { files: {}, fields: {} };

/**
 * Split gently
 * @param {String} str
 * @param {String} delim
 * @return {Array<String>}
 */
const split = (str, delim) => [
  str.substring(0, str.indexOf(delim)),
  str.substring(str.indexOf(delim) + delim.length)
];

export const parseMultipart = (event) => {
  const boundary =
    prefixBoundary +
    getValueIgnoringKeyCase(event.headers, 'Content-Type').split('=')[1];
  if (!boundary) {
    return defaultResult;
  }
  return (event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('binary')
    : event.body
  )
    .split(boundary)
    .filter(item => item.indexOf('Content-Disposition: form-data') !== -1)
    .map((item) => {
      const tmp = split(item, delimData);
      const header = tmp[0];
      let content = tmp[1];
      const name = header.match(/name="([^"]+)"/)[1];
      const result = {};
      result[name] = content;

      if (header.indexOf('filename') !== -1) {
        const filename = header.match(/filename="([^"]+)"/)[1];
        const contentType = header.match(/Content-Type: (.+)/)[1];

        if (contentType.indexOf('text') === -1) {
          // replace content with binary
          content = Buffer.from(content, 'binary');
        }
        result[name] = {
          filename,
          contentType,
          content,
          type: 'file',
          size: content.length,
        };
      }
      return result;
    })
    .reduce((accumulator, current) => Object.assign(accumulator, current), {});
};
