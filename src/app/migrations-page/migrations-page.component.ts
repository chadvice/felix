import { Component, OnInit } from '@angular/core';

import { SylvesterMessengerService } from '../sylvester-messenger.service';

@Component({
  selector: 'app-migrations-page',
  templateUrl: './migrations-page.component.html',
  styleUrls: ['./migrations-page.component.scss']
})
export class MigrationsPageComponent implements OnInit {
  constructor(
    private messenger: SylvesterMessengerService
  ) {}

  ngOnInit(): void {
    this.messenger.setDetailTableName({name: 'migrations', description: 'Migrations'})
  }

}
