import { Component, OnInit } from '@angular/core';

import { SylvesterMessengerService } from '../sylvester-messenger.service';

@Component({
  selector: 'app-metadata-page',
  templateUrl: './metadata-page.component.html',
  styleUrls: ['./metadata-page.component.scss']
})
export class MetadataPageComponent implements OnInit {
  constructor (
    private messenger: SylvesterMessengerService
  ) {}

  ngOnInit(): void {
    this.messenger.setDetailTableName(null);
  }
}
