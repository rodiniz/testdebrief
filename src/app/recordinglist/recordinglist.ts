import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RecordingModel } from '../models/recordingModel';
import { RecordingService } from '../recording.service';
@Component({
  selector: 'app-recordinglist',
  imports: [],
  templateUrl: './recordinglist.html',
  styleUrl: './recordinglist.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recordinglist implements OnInit  {

  recordingService= inject(RecordingService)
   recordings = signal<RecordingModel[]>([]); 
       
    ngOnInit(): void {
      this.loadData();
    }
    loadData(){
      this.recordingService.getRecordings().subscribe({
        next:(resp)=>{         
          this.recordings.set(resp.items);
        },
        error:(err)=>{
          
          console.log(err);
        }
      })  
    }

    testDownload(recordingId:string) {
      this.recordingService.getDocument(recordingId).subscribe({
        next: (resp) => {         
          let blob: Blob;
          let filename = `document_${recordingId}.docx`
          if (resp instanceof Blob) {
            blob = resp;
          } else {
            console.error('Unexpected response type for blob download');
            return;
          }
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);
        },
        error: (err) => {
          console.log(err);
        }
      });
    }
    createMeetingMinutes(recordingId:string){
      this.recordingService.createMeetingMinutes(recordingId).subscribe({
        error:(_err)=>{
            alert(_err);
        }
      })
    }
     createSummary(recordingId:string){
      this.recordingService.createSummary(recordingId).subscribe({
        error:(_err)=>{
            alert(_err);
        }
      })     
    }
    getSubjects(recordingId:string){
      this.recordingService.getRecordingSubjects(recordingId).subscribe({
          next:(_resp)=>{        
            alert('Success');                  
            console.table(_resp);
          },
          error:(_err)=>{
            debugger;
            alert(_err);
            
          }
        });
    }
  }
