import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

import { environment } from '../environments/environment';
import { AuthService } from './auth/auth.service';
import { SylvesterCollection, SylvesterCollectionsDocument, SylvesterDocumentField } from './nelnet/sylvester-collection';
import { CollectionChanges } from './table-structure-editor-dialog/table-structure-editor-dialog.component';

interface APIResponse {
  status: string,
  message?: string
}

@Injectable({
  providedIn: 'root'
})
export class SylvesterApiService {
  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  getTables():Observable<SylvesterCollectionsDocument[]> {
    const url: string = `${environment.sylvesterApiUrl}/tables`

    return this.http.get<SylvesterCollectionsDocument[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterCollectionsDocument[]>('getTables')),
    )
  }

  getTableNames():Observable<string[]> {
    const url: string = `${environment.sylvesterApiUrl}/tablenames`

    return this.http.get<string[]>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<string[]>('getTableNames')),
    )
  }

  getTable(tableName: string):Observable<SylvesterCollection> {
    const url: string = `${environment.sylvesterApiUrl}/table/${tableName}`

    return this.http.get<SylvesterCollection>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<SylvesterCollection>('getTable')),
    )
  }

  alterCollection(collectionName: string, changes: CollectionChanges): Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/collection`

    const body = {
      collectionName: collectionName,
      newDescription: changes.newDescription,
      fieldChanges: changes.fieldChanges
    }

    return this.http.put<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('alterCollection')),
    )
  }

  updateDocument(collection: string, document: Object):Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/document`

    const body = {
      collection: collection,
      document: document
    }

    return this.http.put<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('updateDocument')),
    )
  }

  insertDocument(collection: string, document: Object):Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/document`

    const body = {
      collection: collection,
      document: document
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('insertDocument')),
    )
  }

  deleteDocument(collection: string, id: string):Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/document/${collection}/${id}`

    return this.http.delete<APIResponse>(url, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('deleteDocument')),
    )
  }

  bulkInsert(collectionName: string, documents: Object[]):Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/bulkinsert`

    const body = {
      collectionName: collectionName,
      documents: documents
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('bulkInsert')),
    )
  }

  bulkReplace(collectionName: string, documents: Object[]):Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/bulkreplace`

    const body = {
      collectionName: collectionName,
      documents: documents
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('bulkReplace')),
    )
  }

  bulkCreate(collectionName: string, description: string, fields: SylvesterDocumentField[], documents: Object[]):Observable<APIResponse> {
    const url: string = `${environment.sylvesterApiUrl}/bulkcreate`

    const body = {
      collectionName: collectionName,
      description: description,
      fields: fields,
      documents: documents
    }

    return this.http.post<APIResponse>(url, body, this.getHttpOptions()).pipe(
      catchError(this.handleError<APIResponse>('bulkCreate')),
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
        // alert('apiservice::handleError(): error.status = 401, calling auth.init()')
        this.auth.init();
      }

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
