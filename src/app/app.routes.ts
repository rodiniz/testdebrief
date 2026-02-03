import { Routes } from '@angular/router';
import { RecorderComponent } from './recorder.component/recorder.component';
import { authGuard } from './auth/AuthGuard';
import { Recordinglist } from './recordinglist/recordinglist';
import { Token } from '@angular/compiler';
import { ShowToken } from './ShowToken/ShowToken';

export const routes: Routes = [
    {
        path:'',
        component:RecorderComponent,
        canActivate:[authGuard]
    },
      {
        path:'recordings',
        component:Recordinglist,
        canActivate:[authGuard]
    },
       {
        path:'token',
        component:ShowToken,
        canActivate:[authGuard]
    }
];
