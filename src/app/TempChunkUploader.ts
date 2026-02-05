import { BlockBlobClient, newPipeline } from "@azure/storage-blob";
import { CustomClient } from "./CustomClient";

export class TempChunkUploader {

    private mediaRecorder?: MediaRecorder;    
    private mixedStreamRef?: MediaStream;
    private blockIds :Array<string>=[];
    
   
   //sasUrl will be a url to a container not to a file
  constructor(private sasUrl: string) {}

  async uploadChunk(chunkData: Blob, chunkIndex: number, onUpdate?: (msg: string) => void): Promise<string> {
   
    const chunkName = `${chunkIndex.toString().padStart(6, "0")}.webm`;
    if (onUpdate) onUpdate(`Uploading chunk as blob: ${chunkName}`);
    
    const url = new URL(this.sasUrl);
    
    if (url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    url.pathname += `/${chunkName}`;
    const pipeline = newPipeline(undefined, { httpClient: new CustomClient() });
    const chunkBlobClient = new BlockBlobClient(url.toString(), pipeline);
    try {
      const resp = await chunkBlobClient.uploadData(chunkData);
      if (resp._response.status === 201) {
        if (onUpdate) onUpdate(`Uploaded chunk blob: ${chunkName}`);
      } else {
        if (onUpdate) onUpdate(`Failed to upload chunk blob: ${chunkName}`);
      }
    } catch (err) {
      if (onUpdate) onUpdate(`Error uploading chunk blob: ${chunkName}`);
    }
    return chunkName;
  }
  // Not needed for temp chunk upload, so removed
  public async startRecording(sasUrl:string){
       const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
       const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();       
        

        const displayAudioTracks = displayStream.getAudioTracks();
        
        if (displayAudioTracks.length > 0) {
            const displayAudioStream = new MediaStream(displayAudioTracks);
            const displaySource = audioContext.createMediaStreamSource(displayAudioStream);
            displaySource.connect(destination);
        }

        this.mixedStreamRef = destination.stream;

        this.mediaRecorder = new MediaRecorder(this.mixedStreamRef, {
            mimeType: "audio/webm",
        });
        this.mediaRecorder?.start(5000);
    
        this.mediaRecorder.ondataavailable = async (event: BlobEvent) => {
            if (event.data.size > 0) {
              const chunkName = await this.uploadChunk(event.data, this.blockIds.length);
              this.blockIds.push(chunkName);
            }
       };
       this.mediaRecorder.onstop = () => {
           this.mixedStreamRef?.getTracks().forEach((track) => track.stop());
      }
    }  
  public pause() {
    this.mediaRecorder?.pause();
  }
  public resume() {    
    this.mediaRecorder?.resume();
  }
  public async stop() {   
    this.mediaRecorder?.stop();  
    
  }
}