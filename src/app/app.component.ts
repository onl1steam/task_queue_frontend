import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import $ from 'jquery';

/* Интерфейс Task
   kind - Вид задачи
   name - Условие задачи
   answer - Ответ
   status - Статус задачи
*/
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

  // title - название сайта
  title = 'Task tracker';
  // url - ссылка на POST запрос на сервер с задачами 
  private url = "http://localhost:8080/transferData"
  // serverUrl - ссылка на WebSocket соединение с сервером
  private serverUrl = 'http://localhost:8080/socket'
  // stompClient - клиент библиотеки stompjs для WebSocket соединения
  private stompClient;
  // fileName - имя загруженного файла
  fileName = "Выберете файл"
  // body - список задач, взятый из загруженного файла в формате JSON
  body = {}
  // tasks - массив задач, отображающихся в списке
  tasks: Task[] = []
  // fileToUpload - загружаемый файл
  fileToUpload: File = null;
  // socketTask - задача переданная через сокет соединение
  socketTask: Task
  // taskJSON - задача в JSON формате
  taskJSON

   /* Функция initializeWebSocketConnection()
   Устанавливает WebSocket соединение с сервером
   Принимает приходящие данные от сервера и 
   Обрабатывает их, занося в список задач
   */
  initializeWebSocketConnection(){
    let ws = new SockJS(this.serverUrl);
    this.stompClient = Stomp.over(ws);
    let that = this;
    this.stompClient.connect({}, function(frame) {
      that.stompClient.subscribe("/results", (message) => {
        if(message.body) {
          // Парсинг JSON формата задачи
          this.taskJSON = JSON.parse(message.body)

          this.socketTask = {
            name: " ",
            kind: " ",
            answer: " ",
            status: " "
          }

          // Установка значений полей в списке
          this.taskJSON = JSON.parse(message.body)
          this.socketTask.kind = this.taskJSON["kind"]
          this.socketTask.status = this.taskJSON["status"]

          // Обработка различных вариантов ответов в зависимости от типа задачи
          // Преобразование ответа в удобный для просмотра вид
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
          // Добавление задачи в список
          that.tasks.unshift(this.socketTask)
        }
      });
    });
  }

  /* Функция clearTasks()
  Очищает список задач
   */
  public clearTasks() {
    this.tasks = []
  }

  /* Функция uploadTasks()
  Загружает задачи на сервер
   */
  public uploadTasks() {
    // Проверка на пустой файл
    if (this.body == "") {
      alert("Нет файла")
      return
    }
    // Устоновка заголовков запроса
    let httpHeaders = new HttpHeaders({
      'Content-Type' : 'application/json'
    });    
    let options = {
      headers: httpHeaders
    };   
    // POST запрос на сервер  
    this.http.post(this.url, this.body, options).subscribe(
      article => {
        console.log(this.body);
      })
    // Обработка значений в file input элементе
    this.fileName = "Выберете файл"
    $("#file")[0].value = "";
  }

  /* Функция handleFileInput()
  Обрабатывает загрузку файла на сайт
  Извлекает данные из файла и преобразует
  Их в формат JSON
   */
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

  /* Функция checkForNulls()
  Проверяет поля на null значения
  Заменяет такие поля нужной информацией
   */
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

