import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor() { }

  compare(a: any, b: any, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  ltrim(str: string): string {
    if(!str) return str;
    return str.replace(/^\s+/g, '');
  }

  checkForDuplicates(arr: string[]): boolean {
    return new Set(arr).size !== arr.length
  }

  doArraysMatch(arr1: string[], arr2: string[]): boolean {
    return arr1.every(item => arr2.includes(item)) && arr2.every(item => arr1.includes(item));
  }
  
  getAllowedFieldNameCharacters(): RegExp {
    return new RegExp('[a-zA-Z0-9_-]');
  }

  // Taken from https://stackoverflow.com/a/58181757/17516611
  csv2arr(str: string): string[][] {
    let line = ["",];
    const ret = [line,];
    let quote = false;

    for (let i = 0; i < str.length; i++) {
        const cur = str[i];
        const next = str[i + 1];

        if (!quote) {
            const cellIsEmpty = line[line.length - 1].length === 0;
            if (cur === '"' && cellIsEmpty) quote = true;
            else if (cur === ",") line.push("");
            else if (cur === "\r" && next === "\n") { line = ["",]; ret.push(line); i++; }
            else if (cur === "\n" || cur === "\r") { line = ["",]; ret.push(line); }
            else line[line.length - 1] += cur;
        } else {
            if (cur === '"' && next === '"') { line[line.length - 1] += cur; i++; }
            else if (cur === '"') quote = false;
            else line[line.length - 1] += cur;
        }
    }
    return ret;
}
}
