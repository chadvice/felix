import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

import { environment } from '../environments/environment';
import { AuthService } from './auth/auth.service';
import { table } from './nelnet/nelnet-table';

@Injectable({
  providedIn: 'root'
})
export class SylvesterApiService {
  // private httpOptions = {
  //   headers: new HttpHeaders(
  //     {
  //       'Content-Type': 'application/json; charset=UTF-8',
  //       'x-api-key': 'fpQwusK0HH6Ltlox2yf3r738VuG0ri1qaopWAzMa'
  //     }
  //   )
  // };

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  getFelixTables():Observable<table> {
    const url: string = `${environment.sylvesterApiUrl}/felixtables`

    return this.http.get<table>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<table>('getTables')),
    )
  }

  getFelixTable(tableName: string):Observable<table> {
    const url: string = `${environment.sylvesterApiUrl}/felixtable/${tableName}`

    return this.http.get<table>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<table>('getTable')),
    )
  }

  getTables():Observable<table> {
    const url: string = `${environment.sylvesterApiUrl}/tables`

    return this.http.get<table>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<table>('getTables')),
    )
  }

  getTable(tableName: string):Observable<table> {
    const url: string = `${environment.sylvesterApiUrl}/table/${tableName}`

    return this.http.get<table>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<table>('getTable')),
    )
  }

  getHttpOptions() {
    const x = this.auth.getToken();
    const httpOptions = {
      headers: new HttpHeaders(
        {
          Authorization: 'Bearer ' + this.auth.getToken()
        }
      )
    }

    return httpOptions;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      if (error.status === 401) {
        alert('apiservice::handleError(): error.status = 401, calling auth.init()')
        this.auth.init();
      }

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
