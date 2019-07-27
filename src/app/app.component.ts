import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import $ from 'jquery';

export interface Task {
  name: string;
  kind: string;
  answer: string;
  status: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  constructor(private http: HttpClient) { 
    this.initializeWebSocketConnection();
  }

  title = 'Task tracker';
  url = "http://localhost:8080/transferData"
  private serverUrl = 'http://localhost:8080/socket'
  private stompClient;

  body = JSON.stringify([
    {"kind":"Quadratic equation","input":{"a":24.179989496536646,"b":69.01546678936992,"c":97.51400412803093}},{"kind":"Translation","input":{"lang":"ru","text":"Bye"}},{"kind":"Quadratic equation","input":{"a":52.278068604787364,"b":88.84215950733152,"c":14.278357271831055}},{"kind":"Quadratic equation","input":{"a":61.88690751896717,"b":75.58170253629892,"c":92.2112661477901}},{"kind":"Quadratic equation","input":{"a":8.139653807553715,"b":80.79410884126384,"c":69.53589819438987}}])

  tasks: Task[] = [
    {
      name: "Перевести Hi на русский",
      kind: "Перевод",
      answer: "Привет",
      status: "Завершена",
    }
  ]

  socketTask: Task
  taskJSON

  initializeWebSocketConnection(){
    let ws = new SockJS(this.serverUrl);
    this.stompClient = Stomp.over(ws);
    let that = this;
    this.stompClient.connect({}, function(frame) {
      that.stompClient.subscribe("/results", (message) => {
        if(message.body) {
          this.taskJSON = JSON.parse(message.body)

          this.socketTask = {
            name: " ",
            kind: " ",
            answer: " ",
            status: " "
          }

          this.taskJSON = JSON.parse(message.body)
          this.socketTask.kind = this.taskJSON["kind"]
          this.socketTask.status = this.taskJSON["status"]

          switch (this.socketTask.kind) {
            case "Translation":
                this.socketTask.answer = this.taskJSON["input"]["text"]
                this.socketTask.name = "Перевод " + "\"" + this.taskJSON["output"]["translated"] + 
                "\"" + " на " + this.taskJSON["input"]["lang"]
              break
            case "Quadratic equation":
                this.socketTask.name = "A: " + 
                this.taskJSON["input"]["a"] + " B: " +
                this.taskJSON["input"]["b"] + " C: " +  
                this.taskJSON["input"]["c"]
                this.socketTask.answer = "x1: " + that  .checkForNulls(this.taskJSON["output"]["x1"]) + " x2: " +
                that.checkForNulls(this.taskJSON["output"]["x2"])
              break
            case "E-mail":
              this.socketTask.answer = ""
              this.socketTask.name = ""
              break
          }

          that.tasks.unshift(this.socketTask)
        }
      });
    });
  }

  sendMessage(message){
    this.stompClient.send("/app/send/message" , {}, message);
    $('#input').val('');
  }

  public addTask() {
    this.tasks.unshift(
      {
        name: "Перевести Hi на русский",
        kind: "Перевод",
        answer: "Привет",
        status: "Завершена",
      }
    );
  }

  public clearTasks() {
    this.tasks = []
  }

  public uploadTasks() {
    let httpHeaders = new HttpHeaders({
      'Content-Type' : 'application/json'
    });    
    let options = {
      headers: httpHeaders
    };        
    this.http.post(this.url, this.body, options).subscribe(
      article => {
        console.log(this.body);
      })
  }

  public checkForNulls(root) {
    if (root == null) {
      root = " Нет корня"
    }
    return root
  }
}

