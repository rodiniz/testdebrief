import { BlockBlobClient, newPipeline } from "@azure/storage-blob";
import { CustomClient } from "./CustomClient";

interface Recording { 
  blockIds: string[];
  sasUrl: string; 
}

export class ResumableRecorder {
    constructor(private onUpdate: (newValue: string) => void) {
      
      
    }
    private mediaRecorder?: MediaRecorder;
    private state: Recording ={ sasUrl:'',blockIds:[]};
    private analyser?: AnalyserNode;
    private animationFrameId?: number;
    private volumeCallback?: (volume: number) => void;
    private mixedStreamRef?: MediaStream;
    private blockBlobClient?:BlockBlobClient;
    
    public setVolumeCallback(callback: (volume: number) => void) {
        this.volumeCallback = callback;
    }
    updateData(newValue: string) {
      this.onUpdate(newValue);
    }
    private monitorVolume() {
        if (!this.analyser || !this.volumeCallback) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        const checkVolume = () => {
            this.analyser!.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const volume = Math.min(100, (average / 255) * 100);
            this.volumeCallback!(volume);
            this.animationFrameId = requestAnimationFrame(checkVolume);
        };
        
        checkVolume();
    }
    
    private stopMonitoring() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
        }
        if (this.volumeCallback) {
            this.volumeCallback(0);
        }
    }
    private createBlobClient(){
      const url = new URL(this.state!.sasUrl);
      const pipeline = newPipeline(undefined, {
                httpClient: new CustomClient()
         });
        this.blockBlobClient = new BlockBlobClient(url.toString(),pipeline);
    }
    public async startRecording(sasUrl:string){
         this.state= {
            blockIds:[],
            sasUrl:sasUrl
         }
         this.createBlobClient();
         this.GetUncommitedBlocks();        
         const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
         const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        
        // Create analyser for volume monitoring
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(this.analyser);
        micSource.connect(destination);

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
        this.monitorVolume();
        this.mediaRecorder.ondataavailable = async (event: BlobEvent) => {
            if (event.data.size > 0) {                                                             
                const blockId = btoa(this.state.blockIds.length.toString().padStart(6, "0"));
                this.updateData(`Staging block ${blockId}`);
                let resp=await this.blockBlobClient!.stageBlock(blockId, event.data, event.data.size);
                if(resp._response.status===500){
                  this.updateData(`Failed to stage block`);
                }
                this.state!.blockIds.push(blockId);                                
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
    this.stopMonitoring();
    this.mediaRecorder?.stop();
    
    if (this.state.blockIds.length > 0) {
      await this.commitBlocks();
    }
   
  }
  private async GetUncommitedBlocks(){  
    var list= await this.blockBlobClient!.getBlockList('uncommitted');      
    let isResume=list.uncommittedBlocks?.length??1 >1;
    if(isResume){
      this.updateData('Loaded data from previous recording')
    }
    list.uncommittedBlocks?.forEach(c=>{ 
      this.state.blockIds.push(c.name);
    });  
   }
  private async commitBlocks() {     
     this.updateData(`Comitting ${this.state.blockIds.length}`);
     const ret=await this.blockBlobClient!.commitBlockList(this.state.blockIds);
     this.updateData(`Finished comitting  ${ret._response.status}`);    
  }

}