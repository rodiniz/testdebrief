import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { PagedModel } from './models/pagedModel';
import { RecordingModel } from './models/recordingModel';
import { catchError, of, map, retry } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecordingService {

  httpclient=inject(HttpClient);

  getRecordings(){
    return this.httpclient.get<PagedModel<RecordingModel>>(`${environment.smartDebriefApi}/v0/recording?pageSize=25&pageNumber=1`)
  }
  updateRecording(recordingId:string){
    return this.httpclient.patch(`${environment.smartDebriefApi}/v0/recording`,{recordingId:recordingId, status:4})
  }
  getDocument(recordindId:string){
    const params = new HttpParams().set('content', 1);

    return this.httpclient.get(`${environment.smartDebriefApi}/v0/recording/${recordindId}/DownloadDocument`, { params, responseType: 'blob' })
      .pipe(
        catchError((err) => {
          return of(err);
        }),
        map(response => {
          if (response.size === 0) {
            throw new Error();
          }
          return response;
        }),
        retry({ count: 3, delay: 5000 })
      );   
  }
  createMeetingMinutes(recordingId:string){
      return this.httpclient.post(`${environment.smartDebriefApi}/v0/recording/CreateMinutes`,{recordingId:recordingId})
  }
  createSummary(recordingId:string){
      return this.httpclient.post(`${environment.smartDebriefApi}/v0/recording/CreateSummary`,{recordingId:recordingId})
  }
  getRecordingSubjects(recordingId:string){
    const url=`${environment.smartDebriefApi}/v0/recording/${recordingId}/Subject`;
    console.log("url",url);
    return this.httpclient.get(url);
  }
}
