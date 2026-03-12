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
        const fileName = element.name || element.segment.name;
        zip.file(fileName + ' (file ' + (index + 1) + ').json', JSON.stringify(element));
      });
      zip.generateAsync({ type: 'base64' }).then((content) => {
        this.download(zipFileName + '.zip', content, true);
      });
    } else {
      const filename = data[0].name || data[0].segment.name;
      this.download(filename + '.json', data[0], false);
    }
  }

  downloadValuesAsCSV(values: string[], fileName: string): void {
    const csvContent = values.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}
