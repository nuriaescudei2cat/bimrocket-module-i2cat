import { IOManager } from "../../../../platform/io/IOManager.js";
import { ObjectUtils } from "../../../../platform/utils/ObjectUtils.js";
import * as THREE from "three";

describe("Given the IOManager", () =>
{
  const originalFormats = { ...IOManager.formats };
  const mockLoaderOptions = { quality: "high" };
  const mockExporterOptions = { precision: 3 };

  class MockLoader
  {
    static options = mockLoaderOptions;

    constructor(manager)
    {
      this.manager = manager;
    }

    parse(data)
    {
      return data;
    }
  }

  class MockExporter
  {
    static options = mockExporterOptions;

    parse()
    {
      return "exported";
    }
  }

  beforeAll(() =>
  {
    IOManager.formats = {
      text: {
        extensions: ["txt"],
        mimeType: "text/plain",
        mimeTypes: { txt: "text/plain; charset=utf-8" },
        dataType: "text",
        loader: { class: MockLoader },
        exporter: { class: MockExporter },
      },
      binary: {
        extensions: ["bin"],
        mimeType: "application/octet-stream",
        dataType: "arraybuffer",
        loader: { class: MockLoader },
      },
      geometry: {
        extensions: ["geom"],
        dataType: "text",
      },
      word: {
        extensions: ["doc", "docx"],
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        mimeTypes: {
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        icon: "word",
      },
      excel: {
        extensions: ["xls", "xlsx"],
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        mimeTypes: {
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        icon: "excel",
      },
    };
  });

  afterAll(() =>
  {
    IOManager.formats = originalFormats;
  });

  beforeEach(() =>
  {
    window.localStorage.clear();
    IOManager.formats.text.loader = { class: MockLoader };
    IOManager.formats.text.exporter = { class: MockExporter };
  });

  describe("When identifying a format", () =>
  {
    test.each([
      ["model.TXT", "text"],
      ["folder/model.bin", "binary"],
    ])("Then it identifies %s as %s", (fileName, expectedFormat) =>
    {
      expect(IOManager.getFormat(fileName)).toBe(expectedFormat);
    });

    test.each([undefined, null, 42, "README", "."])
      ("Then it returns null for an unsupported filename (%s)", fileName =>
      {
        expect(IOManager.getFormat(fileName)).toBeNull();
      });

    test("Then it returns format details with an extension-specific MIME type", () =>
    {
      expect(IOManager.getFormatInfo("document.doc")).toMatchObject({
        icon: "word",
        mimeType: "application/msword",
      });
      expect(IOManager.getFormatInfo("text")).toBe(IOManager.formats.text);
    });

    test("Then it finds a format by its default MIME type", () =>
    {
      expect(IOManager.getFormatInfoByMimeType("text/plain")).toBe(
        IOManager.formats.text);
      expect(IOManager.getFormatInfoByMimeType("unknown/type")).toBeUndefined();
    });
  });

  describe("When persisting loader and exporter options", () =>
  {
    test("Then it saves options and uses the saved values on subsequent reads", () =>
    {
      const loaderOptions = { color: "red" };
      const exporterOptions = { precision: 8 };
      IOManager.setLoaderOptions("text", loaderOptions);
      IOManager.setExporterOptions("text", exporterOptions);

      expect(IOManager.getLoaderOptions("text")).toEqual(loaderOptions);
      expect(IOManager.getExporterOptions("text")).toEqual(exporterOptions);
    });

    test("Then it uses factory defaults when requested or when no saved options exist", () =>
    {
      expect(IOManager.getLoaderOptions("text")).toBe(mockLoaderOptions);
      expect(IOManager.getLoaderOptions("text", true)).toBe(mockLoaderOptions);
      expect(IOManager.getExporterOptions("text")).toBe(mockExporterOptions);
      expect(IOManager.getExporterOptions("text", true)).toBe(mockExporterOptions);
    });
  });

  describe("When loading a file", () =>
  {
    test("Then it parses supplied data and completes with a scaled object", () =>
    {
      const completed = jest.fn();
      const scaleModel = jest.spyOn(ObjectUtils, "scaleModel");
      const object = new THREE.Object3D();
      const loader = {
        parse: jest.fn(() => object),
      };
      IOManager.formats.text.loader.class = jest.fn(() => loader);

      IOManager.load({
        url: "https://example.test/model.txt",
        data: "model data",
        onCompleted: completed,
      });

      expect(loader.parse).toHaveBeenCalledWith("model data");
      expect(scaleModel).toHaveBeenCalledWith(object, "m");
      expect(completed).toHaveBeenCalledWith(object);
      scaleModel.mockRestore();
    });

    test("Then it reports an error for missing, unsupported, or unloadable formats", () =>
    {
      const onError = jest.fn();

      IOManager.load({ onError });
      IOManager.load({ url: "model.unknown", onError });
      IOManager.load({ url: "model.geom", format: "geometry", onError });

      expect(onError).toHaveBeenNthCalledWith(1, "Can't determinate format", -1);
      expect(onError).toHaveBeenNthCalledWith(2, "Unsupported format", -1);
      expect(onError).toHaveBeenNthCalledWith(3, "Unsupported format: geometry", -1);
    });

    test("Then it loads a remote text file and reports progress and HTTP errors", () =>
    {
      const previousXHR = global.XMLHttpRequest;
      const requestInstances = [];
      class MockXHR
      {
        static DONE = 4;
        static LOADING = 3;

        constructor()
        {
          this.readyState = 0;
          this.status = 500;
          this.responseText = "failure";
          requestInstances.push(this);
        }

        open(...args) { this.openArgs = args; }
        send() { this.sent = true; }
        getResponseHeader() { return "10"; }
      }

      global.XMLHttpRequest = MockXHR;
      const onProgress = jest.fn();
      const onError = jest.fn();

      try
      {
        IOManager.load({
          url: "https://example.test/model.txt",
          onProgress,
          onError,
        });

        const request = requestInstances[0];
        request.readyState = MockXHR.LOADING;
        request.onreadystatechange();
        request.readyState = MockXHR.LOADING;
        request.onreadystatechange();
        request.readyState = MockXHR.DONE;
        request.onreadystatechange();

        expect(request.openArgs).toEqual(["GET", "https://example.test/model.txt", true]);
        expect(request.sent).toBe(true);
        expect(onProgress).toHaveBeenNthCalledWith(1, {
          progress: 70,
          message: "Downloading file...",
        });
        expect(onProgress).toHaveBeenLastCalledWith({ progress: 100, message: "" });
        expect(onError).toHaveBeenCalledWith(expect.stringContaining("HTTP 500"), 500);
      }
      finally
      {
        global.XMLHttpRequest = previousXHR;
      }
    });

    test("Then it reports an authentication error when the request status is zero", () =>
    {
      const previousXHR = global.XMLHttpRequest;
      class MockXHR
      {
        static DONE = 4;
        constructor()
        {
          this.readyState = MockXHR.DONE;
          this.status = 0;
          this.responseText = "unauthorized";
        }
        open() {}
        send() { this.onreadystatechange(); }
      }
      global.XMLHttpRequest = MockXHR;
      const onError = jest.fn();

      try
      {
        IOManager.load({ url: "https://example.test/model.txt", onError });
        expect(onError).toHaveBeenCalledWith({
          status: 0,
          message: "Authentication failed",
          response: "unauthorized",
        });
      }
      finally
      {
        global.XMLHttpRequest = previousXHR;
      }
    });

    test("Then it parses a successful remote response and handles an unknown content length", () =>
    {
      const previousXHR = global.XMLHttpRequest;
      const parseData = jest.spyOn(IOManager, "parseData");
      const log = jest.spyOn(console, "log").mockImplementation(() => {});
      class MockXHR
      {
        static DONE = 4;
        static LOADING = 3;

        constructor()
        {
          this.readyState = 0;
          this.status = 207;
          this.responseText = "remote data";
        }

        open() {}
        send()
        {
          this.readyState = MockXHR.LOADING;
          this.onreadystatechange();
          this.onreadystatechange();
          this.readyState = MockXHR.DONE;
          this.onreadystatechange();
        }
        getResponseHeader() { return "0"; }
      }

      global.XMLHttpRequest = MockXHR;
      const onProgress = jest.fn();
      const onCompleted = jest.fn();

      try
      {
        IOManager.load({
          url: "https://example.test/remote.txt",
          onProgress,
          onCompleted,
        });

        expect(onProgress).toHaveBeenNthCalledWith(1, {
          progress: undefined,
          message: "Downloading file...",
        });
        expect(onProgress).toHaveBeenLastCalledWith({ progress: 100, message: "" });
        expect(parseData).toHaveBeenCalledWith(
          expect.any(MockLoader),
          "https://example.test/remote.txt",
          "remote data",
          "m",
          onCompleted,
          onProgress,
          undefined,
          mockLoaderOptions);
      }
      finally
      {
        global.XMLHttpRequest = previousXHR;
        parseData.mockRestore();
        log.mockRestore();
      }
    });

    test("Then it reads remote binary responses as array buffers", () =>
    {
      const previousXHR = global.XMLHttpRequest;
      const parseData = jest.spyOn(IOManager, "parseData");
      const log = jest.spyOn(console, "log").mockImplementation(() => {});
      const data = new ArrayBuffer(8);
      class MockXHR
      {
        static DONE = 4;

        constructor()
        {
          this.readyState = MockXHR.DONE;
          this.status = 200;
          this.response = { arrayBuffer: jest.fn(() => data) };
        }

        open() {}
        send() { this.onreadystatechange(); }
      }

      global.XMLHttpRequest = MockXHR;

      try
      {
        IOManager.load({ url: "https://example.test/file.bin" });
        expect(parseData).toHaveBeenCalledWith(
          expect.any(MockLoader),
          "https://example.test/file.bin",
          data,
          "m",
          undefined,
          undefined,
          undefined,
          mockLoaderOptions);
      }
      finally
      {
        global.XMLHttpRequest = previousXHR;
        parseData.mockRestore();
        log.mockRestore();
      }
    });
  });

  describe("When parsing loader data", () =>
  {
    test("Then it supports Collada, IFC, and GLTF loader parse conventions", () =>
    {
      const scene = new THREE.Object3D();
      const completed = jest.fn();
      const colladaLoader = {
        loadMethod: 1,
        parse: jest.fn(() => ({ scene })),
      };
      IOManager.parseData(colladaLoader, "https://example.test/model.dae",
        "data", "m", completed);
      expect(colladaLoader.parse).toHaveBeenCalledWith("data", "https://example.test/");
      expect(completed).toHaveBeenCalledWith(scene);

      const ifcLoader = {
        loadMethod: 2,
        parse: jest.fn((data, onCompleted) => onCompleted(scene)),
      };
      IOManager.parseData(ifcLoader, "model.ifc", "data", "m", completed);
      expect(ifcLoader.parse).toHaveBeenCalledWith(
        "data", expect.any(Function), undefined, undefined, undefined);

      const gltfLoader = {
        loadMethod: 3,
        parse: jest.fn((data, path, onCompleted) => onCompleted({ scene })),
      };
      IOManager.parseData(gltfLoader, "https://example.test/model.gltf",
        "data", "m", completed);
      expect(gltfLoader.parse).toHaveBeenCalledWith(
        "data", "https://example.test/", expect.any(Function), undefined);
      expect(completed).toHaveBeenCalledTimes(3);
    });

    test("Then it converts geometry results to meshes and reports parse failures", () =>
    {
      const geometry = new THREE.BufferGeometry();
      const mesh = IOManager.createObject(geometry);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      expect(IOManager.createObject(new THREE.Object3D())).toBeInstanceOf(THREE.Object3D);
      expect(IOManager.createObject({})).toBeUndefined();

      const onError = jest.fn();
      IOManager.parseData({ loadMethod: 0, parse: () => { throw new Error("invalid"); } },
        "model.geom", "bad data", "m", undefined, undefined, onError);
      expect(onError).toHaveBeenCalledWith("Error: invalid", -1);
    });
  });

  describe("When exporting an object", () =>
  {
    test("Then it creates a Blob from the exporter result", () =>
    {
      const onCompleted = jest.fn();

      IOManager.export({
        name: "drawing.txt",
        object: {},
        onCompleted,
      });

      expect(onCompleted).toHaveBeenCalledWith(expect.any(Blob));
      expect(onCompleted.mock.calls[0][0].type).toBe("text/plain");
    });

    test("Then it reports unsupported formats and supports asynchronous exporters", () =>
    {
      const onError = jest.fn();
      IOManager.export({ name: "drawing.unknown", object: {}, onError });
      IOManager.export({ name: "drawing.geom", object: {}, onError });
      expect(onError).toHaveBeenNthCalledWith(1, "Can't determinate format", -1);
      expect(onError).toHaveBeenNthCalledWith(2, "Unsupported format: geometry", -1);

      const onCompleted = jest.fn();
      const exporter = {
        parse: jest.fn((object, callback) => callback(new ArrayBuffer(4))),
      };
      IOManager.formats.text.exporter = {
        class: jest.fn(() => exporter),
        exportMethod: 1,
      };
      IOManager.export({ format: "text", object: {}, onCompleted });
      expect(exporter.parse).toHaveBeenCalled();
      expect(onCompleted.mock.calls[0][0]).toBeInstanceOf(Blob);
    });

    test("Then it converts structured results and handles empty, unsupported, or failing exports", () =>
    {
      const onCompleted = jest.fn();
      const onError = jest.fn();
      const exporter = {
        mimeType: "application/json",
        exportMethod: 0,
        parse: () => null,
      };

      IOManager.parseObject(exporter, {}, onCompleted, undefined, onError,
        undefined);
      expect(onCompleted).toHaveBeenLastCalledWith("");

      IOManager.parseObject(
        { ...exporter, parse: () => ({ data: "serialized" }) },
        {}, onCompleted, undefined, onError, undefined);
      expect(onCompleted.mock.calls[1][0]).toBeInstanceOf(Blob);

      IOManager.parseObject(
        { ...exporter, parse: () => ({ value: 1 }) },
        {}, onCompleted, undefined, onError, undefined);
      expect(onCompleted.mock.calls[2][0]).toBeInstanceOf(Blob);

      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      IOManager.parseObject(
        { ...exporter, parse: () => 12 },
        {}, onCompleted, undefined, onError, undefined);
      expect(warn).toHaveBeenCalledWith("Unsupported export result", 12);
      expect(onCompleted).toHaveBeenLastCalledWith("");
      warn.mockRestore();

      IOManager.parseObject(
        { ...exporter, parse: () => { throw new Error("export failed"); } },
        {}, onCompleted, undefined, onError, undefined);
      expect(onError).toHaveBeenCalledWith("Error: export failed", -1);
    });
  });

  describe("When listing supported extensions and normalizing filenames", () =>
  {
    test("Then it returns all extensions and keeps only supported filename characters", () =>
    {
      expect(IOManager.getSupportedLoaderExtensions()).toEqual(
        expect.arrayContaining(["txt", "bin", "geom", "doc", "xlsx"]));
      expect(IOManager.normalizeFilename("My file-name: v2.é")).toBe("My_file_name__v2");
    });
  });
});
