import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { ConnectionComponent } from './components/connection/connection.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TestRunnerComponent } from './components/test-runner/test-runner.component';

const routes: Routes = [
  { path: '', component: ConnectionComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'test-runner', component: TestRunnerComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    ConnectionComponent,
    DashboardComponent,
    TestRunnerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
