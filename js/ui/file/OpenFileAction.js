/**
 * OpenFileAction.i2cat.js
 *
 * @author nuriaescudei2cat
 */

import { OpenFileAction } from "modules/base/ui/file/OpenFileAction.js";
import { IOManager } from "platform/io/IOManager.js";
import { MessageDialog } from "platform/ui/dialog/MessageDialog.js";
import { Environment } from "environment";

class OpenFileActionCustom extends OpenFileAction 
{
  perform() 
  {
    const fileExplorer = this.fileExplorer;
    const name = fileExplorer.selectedEntry.name;
    const formatInfo = IOManager.getFormatInfo(name);

    if (formatInfo && (formatInfo.icon === "word" || formatInfo.icon === "excel")) 
    {
      fileExplorer.open(async (url, result) => 
      {
      try 
        {
          const fileBlob = new Blob([result.data], { type: formatInfo.mimeType });
          const fileName = result.path.split('/').pop() || "document";
          
          let gotenbergApiUrl = Environment.SERVER_URL + `/api/convert-pdf?filename=${encodeURIComponent(fileName)}`;
          
          if (formatInfo.icon === "excel") {
            gotenbergApiUrl += "&singlePageSheets=true";
          }

          const gotenbergResponse = await fetch(gotenbergApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': formatInfo.mimeType
            },
            body: fileBlob 
          });

          if (!gotenbergResponse.ok) throw new Error("Error en la conversió a Gotenberg.");
          
          const pdfBlob = await gotenbergResponse.blob();
          const objectUrl = URL.createObjectURL(pdfBlob);
          const newWindow = window.open("", "_blank");

          if (newWindow)
          {
            const previewDocument = newWindow.document;
            previewDocument.title = fileName;

            const style = previewDocument.createElement("style");
            style.textContent = `
              body { margin: 0; padding: 0; overflow: hidden; background-color: #525659; }
              iframe { width: 100vw; height: 100vh; border: none; }
            `;
            previewDocument.head.appendChild(style);

            const iframe = previewDocument.createElement("iframe");
            iframe.src = objectUrl;
            previewDocument.body.appendChild(iframe);
          }
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        }
        catch (error) 
        {
          console.error(error);
          MessageDialog.create("title.error", "S'ha produït un error en previsualitzar el document.")
            .setI18N(fileExplorer.application.i18n)
            .show();
        }
      });
    } 
    else 
    {
      super.perform();
    }
  }
}

export { OpenFileActionCustom };