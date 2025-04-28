import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as ace from 'ace-builds';
import { Range } from 'ace-builds';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  // @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLDivElement>;
  @ViewChild('editor', { static: false }) editor!: ElementRef<HTMLDivElement>;

  @ViewChild('iframePreview', { static: true }) iframePreview!: ElementRef<HTMLIFrameElement>;
  isFullscreen: boolean = false;

  private aceEditorInstance: ace.Ace.Editor | undefined;
  private openAI_API_KEY = ''; // 🔥 PON TU API KEY DE OPENAI AQUÍ

//   defaultHtml: string = `
// <!DOCTYPE html>
// <html>
// <head>
//   <style>
//     body { font-family: Arial; margin: 20px; }
//     h1 { color: navy; }
//   </style>
// </head>
// <body>
//   <h1>Hola Mundo</h1>
//   <p>Bienvenido a tu editor HTML en vivo.</p>
// </body>
// </html>
//   `;


defaultHtml: string = 
`<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
<h1>Hola 👋</h1>
<p>Bienvenido a tu editor 📄 HTML, CSS y Javascript en vivo🔥🔥🔥 <br> portenciada con IA🚀.</p>

<button class="btn btn-info text-center">puedes quitar la referencia del bootstrap si lo deseas <br>
y/o agregar referencias a tu gusto
</button>\n`;


sugerenciaVisible: boolean = false;
textoSugerencia: string = '';
ultimaPalabraDetectada: string = '';

 sugerenciasRapidas: { [key: string]: string } = {
  "butto": "<button></button>",
  "div": "<div></div>",
  "span": "<span></span>",
  "img": "<img src='' alt=''>",
  "inpu": "<input type='text'>",
  "a": "<a href=''></a>",
  "tabl": "<table><tr><td></td></tr></table>"
};

  constructor() {}

  ngAfterViewInit() {
    ace.config.set("basePath", "assets/ace/src-noconflict");
    ace.config.setModuleUrl('ace/ext/language_tools', 'assets/ace/src-noconflict/ext-language_tools.js');

    this.aceEditorInstance = ace.edit(this.editor.nativeElement);
    // Cargar extensión language_tools
   // const langTools = ace.require('ace/ext/language_tools');
    this.aceEditorInstance.setTheme('ace/theme/monokai');
    this.aceEditorInstance.session.setMode('ace/mode/html');
    this.aceEditorInstance.setValue(this.defaultHtml, -1);
    this.aceEditorInstance.setOptions({
      fontSize: "14px",
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      // showLineNumbers: false,        // 🔥 Desactiva los números de línea
      // showGutter: false              // 🔥 Oculta toda la barra lateral donde están los números
    });
    // // 🔥 ESTO ACTIVA EL AUTOCOMPLETADO BÁSICO
    // this.aceEditorInstance.completers = [langTools.textCompleter, langTools.keyWordCompleter, langTools.snippetCompleter];
    // 🔥 AQUI CONECTAMOS
    this.aceEditorInstance.on('input', () => {
      this.detectarPalabrasClave();
    });
    
    const langTools = (window as any).ace.require('ace/ext/language_tools');
    //this.aceEditorInstance.completers = [langTools.textCompleter, langTools.keyWordCompleter, langTools.snippetCompleter];

    this.aceEditorInstance.session.on('change', () => {
      this.updatePreview();
    });

    this.editor.nativeElement.addEventListener('dblclick', (e: MouseEvent) => {
 
      this.procesarDobleClick(e);
    });

    this.updatePreview();
  }

  updatePreview() {
    if (!this.aceEditorInstance) return;

    const content = this.aceEditorInstance.getValue();
    const iframeDoc = this.iframePreview.nativeElement.contentDocument || this.iframePreview.nativeElement.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(content);
      iframeDoc.close();
    }
  }

  async pedirAyudaIA() {
    const prompt = window.prompt('¿Qué quieres que genere la IA? (Ejemplo: "Crea una tabla simple")');
    if (!prompt) return;
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un asistente que genera solo código HTML, CSS o JavaScript dentro del body, sin explicaciones.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });
  
    const data = await response.json();
    const contenidoGenerado = data.choices[0].message.content.trim();
  
    if (this.aceEditorInstance) {
      const htmlActual = this.aceEditorInstance.getValue();
  
      // Usar regex para reemplazar solo el contenido dentro del <body>...</body>
      // const nuevoHtml = htmlActual.replace(
      //   /<body[^>]*>[\s\S]*<\/body>/i,
      //   `<body>\n${contenidoGenerado}\n</body>`
      // );
  
      this.aceEditorInstance.setValue(contenidoGenerado, -1);
    }

  }

  detectarPalabrasClave() {
    if (!this.aceEditorInstance) return;
  
    const cursor = this.aceEditorInstance.getCursorPosition();
    const session = this.aceEditorInstance.session;
    const line = session.getLine(cursor.row);
    const palabras = line.trim().split(/\s+/);
  
    const ultimaPalabra = palabras[palabras.length - 1]?.toLowerCase();
    this.ultimaPalabraDetectada = ultimaPalabra;
 
    const sugerenciasRapidas: { [key: string]: string } = {
      "a": "<a></a>",
      "butto": "<button></button>",
      "tabl": "<table><tr><td></td></tr></table>",
      "inp": "<input type='text'>",
      "spaan": "<span></span>",
      "divv": "<div></div>",
      "img": "<img src='' alt=''>"
    };
  
    const sugerencia = sugerenciasRapidas[ultimaPalabra];
  
    if (sugerencia) {
      this.sugerenciaVisible = true;
      this.textoSugerencia = sugerencia;
    } else {
      this.sugerenciaVisible = false;
    }
  }

  
insertarSugerencia() {
  if (!this.aceEditorInstance || !this.textoSugerencia) return;

  const cursor = this.aceEditorInstance.getCursorPosition();
  const session = this.aceEditorInstance.session;
  const line = session.getLine(cursor.row);

  // Reemplazar la palabra detectada por la sugerencia
  const rango = new Range(cursor.row, line.lastIndexOf(this.ultimaPalabraDetectada), cursor.row, line.length);
  this.aceEditorInstance.session.replace(rango, this.textoSugerencia);

  this.sugerenciaVisible = false; // Ocultamos la barra después
}

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    console.log(this.isFullscreen);
  }


  procesarDobleClick(event: MouseEvent) {
    if (!this.aceEditorInstance) return;
  
    const session = this.aceEditorInstance.session;
    const pos = this.aceEditorInstance.getCursorPosition();
    
    const currentLine = session.getLine(pos.row);
  
    const aperturaIndex = currentLine.lastIndexOf('<', pos.column);
    const cierreDeApertura = currentLine.indexOf('>', pos.column);
  
    if (aperturaIndex === -1 || cierreDeApertura === -1) {
      return;
    }
  
    const aperturaTag = currentLine.substring(aperturaIndex, cierreDeApertura + 1);
    const nombreEtiquetaMatch = aperturaTag.match(/^<(\w+)/);
  
    if (!nombreEtiquetaMatch) {
      return;
    }
  
    const nombreEtiqueta = nombreEtiquetaMatch[1];
    const cierreTag = `</${nombreEtiqueta}>`;
  
    console.log('Buscando cierre de', nombreEtiqueta);
  
    // 🔥 Empezamos a buscar desde la línea actual hacia adelante
    let lineaActual = pos.row;
    let contenido = currentLine.substring(aperturaIndex);
    let encontrado = false;
    let cierreTagLine = -1;
    let cierreTagCol = -1;
  
    while (lineaActual < session.getLength()) {
      if (contenido.includes(cierreTag)) {
        encontrado = true;
        cierreTagLine = lineaActual;
        cierreTagCol = contenido.indexOf(cierreTag);
        break;
      }
      lineaActual++;
      contenido = session.getLine(lineaActual);
    }
  
    if (!encontrado) {
      console.log('No se encontró la etiqueta de cierre.');
      return;
    }
  
    // 🔥 Ahora creamos el rango para eliminar
    const startRow = pos.row;
    const startCol = aperturaIndex;
    const endRow = cierreTagLine;
    const endCol = cierreTagCol + cierreTag.length;
  
    const rangoEliminar = new Range(startRow, startCol, endRow, endCol);
  
    session.replace(rangoEliminar, '');
  }

}
