import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Application } from 'src/app/models/application.model';
import { Align, Style } from 'src/app/models/style.model';
import { AppsService } from 'src/app/services/apps.service';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
/**
 * Componente para el creador de aplicaciones.
 */
export class CreateComponent {
  @ViewChild('close') closeModal;
  app: Application;
  idMessage: string;
  json: File; // archivo model.json cargado
  jsonMessage: string;
  jsonFormat: boolean;
  bin: FileList; // lista de archivos binarios cargados
  binMessage: string;
  binFormat: boolean;
  form: FormGroup;
  errorMessage: string;
  loading: boolean;

  constructor(private fb: FormBuilder, private appsService: AppsService, private router: Router) {
    this.app = new Application("", "<h1 style='text-align: center'>Titulo de la aplicación</h1>", "", new Style(Align.center, 'Arial', "#FFFFFF", "#353535", true), false);
    this.idMessage = "El identificador no puede estar vacío.";
    this.jsonMessage = "Debes seleccionar un archivo en formato \".json\"";
    this.jsonFormat = false;
    this.binMessage = "Debes seleccionar los archivos en formato \".bin\"";
    this.binFormat = false;
    this.errorMessage = "";
    this.loading = false;

    this.form = this.fb.group({
      id: [
        this.app.id,
        Validators.compose([
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9ñÑ._-]+$/)
        ]),
      ],
    });
  }

  /**
   * Establece el id de la aplicación si cumple con las normas establecidas en el formulario.
   * @param id id de la aplicación
   */
  setId(id: string) {
    if (!this.form.controls['id'].errors) {
      this.idMessage = "";
      this.app.id = id;
    }
    else {
      if (this.form.controls['id'].errors['required']) {
        this.idMessage = "El identificador no puede estar vacío.";
      }
      if (this.form.controls['id'].errors['pattern']) {
        this.idMessage = "El identificador contiene caracteres no válidos. Solo puede contener caracteres alfanuméricos, puntos, guiones y/o guiones bajos.";
      }
      if (this.form.controls['id'].errors['maxlength']) {
        this.idMessage = "El identificdor no puede contener más de 20 caracteres.";
      }
    }
  }

  /**
   * Controla que el archivo seleccionado como modelo sea correcto (nombre model.json) y lo establece.
   * @param event archivo seleccionado en el selector
   */
  selectJSON(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.name === 'model.json') {
        this.jsonFormat = true;
        this.jsonMessage = "";
        this.json = file;
      }
      else {
        this.jsonFormat = false;
        this.jsonMessage = "El archivo debe llamarse \"model\" y tener extensión \".json\"";
      }
    }
  }

  /**
   * Controla que los archivos seleccionados como binarios sean correctos (sigan el patrón) y los establece.
   * @param event archivos seleccionados en el selector
   */
  selectBIN(event: any) {
    const files: FileList = event.target.files;
    const pattern = /^group\d+-shard\d+of\d+\.bin$/;
    let validated = true;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (!pattern.test(files[i].name)) {
          validated = false;
        }
      }

      if (validated) {
        this.binFormat = true;
        this.binMessage = "";
        this.bin = files;
      }
      else {
        this.binFormat = false;
        this.binMessage = "Los archivos seleccionados deben seguir el patrón \"groupG-shardNofM\" donde G es el número del grupo, N es el número del archivo del grupo y M es el total de ficheros del grupo, además de tener formato \".bin\"";
      }
    }
  }

  /**
   * Verifica que se pueda crear la aplicación llamando a la función loadLayersModel de TensorFlow.js. Si el modelo no es compatible con la función no se creará la aplicación.
   */
  async onCreate() {
    if (this.form.valid && this.jsonFormat && this.binFormat) {
      this.loading = true;
      const modelTopologyFiles = [this.json];
      const weightPathFiles = Array.from(this.bin);

      const modelIOHandler = tf.io.browserFiles([...modelTopologyFiles, ...weightPathFiles]);

      tf.loadLayersModel(modelIOHandler)
        .then(model => {
          this.postApp();
        })
        .catch(error => {
          console.log(error);
          this.errorMessage = "El modelo seleccionado no es un modelo compatible con esta aplicación. Por favor, lee la <a href=\"/help\">ayuda</a> para más información. Error: " + error;
          this.loading = false;
        });
    }
    else {
      this.errorMessage = "No se ha podido crear la aplicación. Por favor, revisa los campos del formulario.";
    }
  }

  /**
   * Crea la nueva aplicación utilizando la función postApp del servicio, genera y sube los archivos de la aplicación y sube los archivos del modelo.
   * Si se crea y se sube correctamente se cargan los datos del usuario para actualizar su lista de aplicaciones y se navega hasta el editor de aplicaciones para que pueda editar la aplicación creada.
   */
  postApp() {
    this.appsService.postApp(this.app).subscribe( // añade la configuración a la base de datos
      res => {
        this.appsService.uploadAppFiles(this.app).subscribe( // crea la carpeta y añade los archivos de la aplicación
          res => {
            this.appsService.uploadModelFIles(this.app.id, this.json, this.bin).subscribe(
              res => {
                this.appsService.getUser().subscribe(
                  res => {
                    this.appsService.user = res;
                    this.appsService.saveCoockies();
                    this.errorMessage = "";
                    this.closeModal.nativeElement.click();
                    this.loading = false;
                    this.router.navigate(['/edit'], { queryParams: { id: this.app.id } });
                  },
                  err => {
                    console.log(err);
                    this.loading = false;
                    this.appsService.logout();
                    this.router.navigate(['']);
                  }
                );
              },
              err => {
                console.log(err);
                this.loading = false;
                this.errorMessage = "No se ha podido crear la aplicación correctamente. Hubo un error a la hora de subir los modelos al servidor. Inténtelo de nuevo más tarde.";
                this.appsService.deleteApp(this.app.id).subscribe();
              }
            )
          },
          err => {
            console.log(err);
            this.loading = false;
            this.errorMessage = "No se ha podido crear la aplicación correctamente. Hubo un error a la hora de crear el directorio. Inténtelo de nuevo más tarde.";
            this.appsService.deleteApp(this.app.id).subscribe();
          }
        );
      },
      err => {
        console.log(err.status);
        this.loading = false;
        if (err.status === 409) {
          this.errorMessage = "No se ha podido crear la aplicación, el id ya existe.";
        } else {
          this.errorMessage = "Hubo un problema con el servidor a la hora de intentar crear la aplicación. Inténtelo de nuevo más tarde.";
        }
      }
    );
  }
}