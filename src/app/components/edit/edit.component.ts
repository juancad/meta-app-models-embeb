import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Configuration } from 'src/app/models/configuration.model';
import { ActivatedRoute } from '@angular/router';
import { Category } from 'src/app/models/category.model';
import { AppsService } from 'src/app/services/apps.service';
import { Align } from 'src/app/models/style.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Editor, Toolbar, } from 'ngx-editor';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {
  @Input() idConfig: string;
  configuration: Configuration;
  newId: string;
  loaded: boolean; //configuración cargada correctamente
  Align = Align;
  form: FormGroup;
  formMessage: string;
  editorTitle: Editor;
  editorDesc: Editor;
  toolbar: Toolbar;
  colorPresets;
  fontList: { name: string; value: string; }[];

  constructor(private appsService: AppsService, private route: ActivatedRoute, private fb: FormBuilder) {
    this.formMessage = "";
    this.loaded = false;

    this.toolbar = [
      ['bold', 'italic'],
      ['underline', 'strike'],
      ['code'],
      ['ordered_list', 'bullet_list'],
      [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
      ['link', 'image'],
      ['text_color', 'background_color'],
      ['align_left', 'align_center', 'align_right', 'align_justify'],
      ['horizontal_rule', 'format_clear'],
    ];

    this.fontList = [
      { name: 'Arial', value: 'Arial, sans-serif' },
      { name: 'Verdana', value: 'Verdana, sans-serif' },
      { name: 'Times New Roman', value: 'Times New Roman, serif' },
      { name: 'Courier New', value: 'Courier New, monospace' },
      { name: 'Georgia', value: 'Georgia, serif' },
      { name: 'Palatino', value: 'Palatino, serif' },
      { name: 'Garamond', value: 'Garamond, serif' },
      { name: 'Bookman', value: 'Bookman, serif' },
      { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
      { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
      { name: 'Arial Black', value: 'Arial Black, sans-serif' },
      { name: 'Impact', value: 'Impact, sans-serif' }
    ];

    this.colorPresets = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#008000', '#000080', '#800000', '#808080', '#FFD700', '#A9A9A9', '#FF8C00', '#8B008B', '#4B0082', '#FFFFF0', '#F0FFF0', '#F0F8FF', '#F5F5DC', '#FFDAB9', '#DC143C', '#00CED1', '#F08080', '#FF1493', '#0000CD', '#BC8F8F', '#7FFFD4', '#FF00FF', '#DA70D6', '#FFE4C4', '#8A2BE2', '#2F4F4F', '#20B2AA', '#DAA520', '#BDB76B'];
  }

  ngOnInit(): void {
    this.editorTitle = new Editor();
    this.editorDesc = new Editor();

    this.route.queryParams.subscribe(
      res => {
        this.idConfig = res['id'];
        this.newId = res['id'];

        this.appsService.getById(this.idConfig).subscribe(
          res => {
            this.configuration = res;
            this.loaded = true;

            this.form = this.fb.group({
              id: [
                this.newId,
                Validators.compose([
                  Validators.required,
                  Validators.maxLength(20),
                  Validators.pattern(/^[a-zA-Z0-9ñÑ._-]+$/)
                ]),
              ],
              title: [
                this.configuration.title,
                Validators.compose([
                  Validators.required,
                  Validators.minLength(10),
                  Validators.maxLength(1000)
                ]),
              ],
              description: [
                this.configuration.description,
                Validators.compose([
                  Validators.maxLength(15000)
                ]),
              ],
            });
          },
          err => {
            console.error(err);
          }
        );
      },
      err => {
        console.log(err);
      });
  }

  addCategory() {
    this.configuration.categories.push(new Category("Nombre categoría", null, null));
  }

  deleteCategory(category: Category) {
    const index = this.configuration.categories.indexOf(category);
    if (index !== -1) {
      this.configuration.categories.splice(index, 1);
    }
  }

  setTitle(newTitle: any) {
    if (!this.form.controls['title'].errors) {
      this.formMessage = "";
      this.configuration.title = newTitle;

      this.configuration = Object.assign({}, this.configuration);
    }
    else {
      if (this.form.controls['title'].errors['required'] || this.form.controls['title'].errors['minlength']) {
        this.formMessage = "El título de la aplicación no puede estar vacío o ser tan corto.";
      }
      if (this.form.controls['title'].errors['maxlength']) {
        this.formMessage = "El título de la aplicación no puede contener más de 1000 caracteres.";
      }
    }
  }

  setDescription(newDescription: any) {
    if (!this.form.controls['description'].errors) {
      this.formMessage = "";
      this.configuration.description = newDescription;
      this.configuration = Object.assign({}, this.configuration);
    }
    else {
      if (this.form.controls['description'].errors['maxlength']) {
        this.formMessage = "La descripción de la aplicación no puede contener más de 15000 caracteres.";
      }
    }
  }

  setId(id: string) {
    if (!this.form.controls['id'].errors) {
      this.formMessage = "";
      this.newId = id;
    }
    else {
      console.log(this.form.controls['id'].errors);
      if (this.form.controls['id'].errors['required']) {
        this.formMessage = "El identificador no puede estar vacío.";
      }
      if (this.form.controls['id'].errors['pattern']) {
        this.formMessage = "El identificador contiene caracteres no válidos. Solo puede contener caracteres alfanuméricos, puntos, guiones y/o guiones bajos.";
      }
      if (this.form.controls['id'].errors['maxlength']) {
        this.formMessage = "El identificdor no puede contener más de 20 caracteres.";
      }
    }
  }

  setCamAlign(camAlign: Align) {
    this.configuration.style.camAlign = camAlign;
  }
}