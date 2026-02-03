import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderlogoComponent } from '../headerlogo.component/headerlogo.component';

@Component({
  selector: 'app-header',
  imports: [HeaderlogoComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent { }
