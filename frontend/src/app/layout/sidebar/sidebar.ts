import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, NzMenuModule, NzIconModule, NzLayoutModule, MatListModule, MatIconModule, MatRippleModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  @Input() collapsed: boolean = false;
}
