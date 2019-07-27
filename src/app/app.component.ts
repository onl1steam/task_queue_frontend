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

  fileName = "Выберете файл"

  body = ""
  tasks: Task[] = []

  fileToUpload: File = null;

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
            case "Перевод":
                this.socketTask.answer = that.checkForNulls(this.taskJSON["output"], this.socketTask.kind)
                this.socketTask.name = "Перевод " + "\"" + this.taskJSON["input"]["text"] + 
                "\"" + " на \"" + this.taskJSON["input"]["lang"] + "\""
              break
            case "Квадратное уравнение":
                this.socketTask.name = "Коэффициенты: A: " + 
                this.taskJSON["input"]["a"] + " B: " +
                this.taskJSON["input"]["b"] + " C: " +  
                this.taskJSON["input"]["c"]
                this.socketTask.answer = "Ответ: x1: " + that.checkForNulls(this.taskJSON["output"]["x1"], this.socketTask.kind) + 
                " x2: " +
                that.checkForNulls(this.taskJSON["output"]["x2"], this.socketTask.kind)
              break
            case "E-mail":
              this.socketTask.answer = "Тема: \"" + this.taskJSON["input"]["subject"] + "\"" +
              " Текст: \"" + this.taskJSON["input"]["text"] + "\""
              this.socketTask.name = "Письмо для " +
              this.taskJSON["input"]["to"]
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

  public clearTasks() {
    this.tasks = []
  }

  public uploadTasks() {
    console.log(this.body)
    if (this.body == "") {
      alert("Нет файла")
      return
    }
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
    this.fileName = "Выберете файл"
    $("#file")[0].value = "";
  }

  handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
    let fileReader = new FileReader();
    this.fileName = this.fileToUpload.name;
    fileReader.onload = (e) => {
    let parsedJSON = JSON.parse(JSON.stringify(fileReader.result));
    this.body = parsedJSON;
    this.uploadTasks()
    }
    fileReader.readAsText(this.fileToUpload);
  }

  public checkForNulls(root, type) {
    if (root == null && type == "Квадратное уравнение") {
      root = " Нет корня"
    }
    if (root == null && type == "Перевод") {
      root = ""
    } else if(root != null && type == "Перевод") {
      root = root["translated"]
    }
    if (root == null && type == "E-mail") {
      root = ""
    }
    return root
  }
}

