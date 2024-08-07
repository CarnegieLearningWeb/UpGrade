import { Injectable } from '@angular/core';
import JSZip from 'jszip';

@Injectable({
  providedIn: 'root',
})
export class CommonExportHelpersService {
  download(filename, text, isZip: boolean) {
    const element = document.createElement('a');
    isZip
      ? element.setAttribute('href', 'data:application/zip;base64,' + text)
      : element.setAttribute('href', 'data:text/plain;charset=utf-8,' + JSON.stringify(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  convertDataToDownload(data: any[], zipFileName: string) {
    if (data.length > 1) {
      const zip = new JSZip();
      data.forEach((element, index) => {
        zip.file(element.name + ' (File ' + (index + 1) + ').json', JSON.stringify(element));
      });
      zip.generateAsync({ type: 'base64' }).then((content) => {
        this.download(zipFileName + '.zip', content, true);
      });
    } else {
      this.download(data[0].name + '.json', data[0], false);
    }
  }
}