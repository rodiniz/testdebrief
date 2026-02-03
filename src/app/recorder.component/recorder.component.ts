import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { newPipeline, BlockBlobClient } from '@azure/storage-blob';
import { CustomClient } from '../CustomClient';
import { ResumableRecorder } from '../recorder';
import { AuthService } from '../auth/services/auth.service';
import { RecordingService } from '../recording.service';

@Component({
  selector: 'app-recorder.component',
  imports: [],
  templateUrl:'./app-recorder.html',
  styleUrl: './recorder.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecorderComponent { 

  private recordingService =inject(RecordingService);
  sasUrl = signal<string>('');
 
  isRecordStarted=signal<boolean>(false);
  isRecordPaused=signal<boolean>(false);
  logs= signal<string[]>([]);
  recorder:ResumableRecorder= new ResumableRecorder(val => this.logs.set([...this.logs(), val]));
  volume = signal<number>(0);
  
  constructor() {
    this.recorder.setVolumeCallback((vol) => this.volume.set(vol)); 
  }

 
  handleStop() {
    this.recorder.stop();
    this.isRecordStarted.set(false)
    this.addLog('Recording stopped');
  }
  handlePause() {
    this.recorder.pause();
    this.isRecordPaused.set(true);
    this.addLog('Recording paused');
  }
  handleStart() {
   this.recorder.startRecording(this.sasUrl());
   this.isRecordStarted.set(true)
   this.addLog('Recording started');
  }
  handleResume() {
    this.recorder.resume();
    this.isRecordPaused.set(false);
    this.addLog('Recording resumed');
  }
  addLog(log: string) {
    this.logs.set([...this.logs(), log]);
  }

  loadAudioToPlayer() {
  const audioElement = document.querySelector('audio') as HTMLAudioElement;
  if (audioElement && this.sasUrl()) {
    audioElement.src = this.sasUrl();
    audioElement.load(); // Trigger buffering
    this.addLog('Audio streaming from blob storage');
  } else {
    this.addLog('Invalid SAS URL or audio element not found');
  }
}

  async onUploadClick(fileInput: HTMLInputElement) {
    const file = fileInput.files?.[0];
    const sasUrl = "	https://contentcwc.dev.debrief.ibabs.biz/raw/c1a3c0d4-adb6-4a2e-9a78-33286e550d12.wav?skoid=a72b5314-e483-43c8-ab3a-4374f2cf9f8b&sktid=1c71dfb6-c8ba-4966-a446-893a42b4dac7&skt=2025-12-23T10%3A33%3A02Z&ske=2025-12-23T18%3A33%3A02Z&sks=b&skv=2025-05-05&sv=2025-05-05&st=2025-12-23T10%3A33%3A02Z&se=2025-12-23T18%3A33%3A02Z&sr=c&sp=acw&sig=Il572cN8%2FTAgqTp01acIGvLVZn2xA1XILjjSd0dkixo%3D&comp=block&blockid=YmxvY2stMDAwMDAy"
    
    if (file) {   
      try {
        // Create a custom pipeline with the custom HTTP client
        const pipeline = newPipeline(undefined, {
          httpClient: new CustomClient()
        });
        
        // Use BlockBlobClient directly with the blob SAS URL
        const blockBlobClient = new BlockBlobClient(sasUrl, pipeline);       
        // Upload the file       
        this.addLog(`Uploading ${file.name}...`);
        //blockBlobClient.stageBlock("",)
        await blockBlobClient.uploadData(file, {
          
          blockSize: 4 * 1024 * 1024, // 4 MB chunks
          concurrency: 5, // Upload 5 chunks in parallel
          maxSingleShotSize: 8 * 1024 * 1024, // Files larger than 8 MB will be uploaded in chunks
          blobHTTPHeaders: {
            blobContentType: file.type
          },
          onProgress: (progress) => {
            const percentComplete = ((progress.loadedBytes / file.size) * 100).toFixed(2);
            console.log(`Upload progress: ${percentComplete}%`);
            this.addLog(`Upload progress: ${percentComplete}%`);
          }
        });
        
        
       
      } catch (error) {
       
        this.addLog(`Upload failed: ${error}`);
      }
    } else {
      this.addLog('No file selected');
    }
  }
}
