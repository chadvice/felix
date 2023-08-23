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
}
