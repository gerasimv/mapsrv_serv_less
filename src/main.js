let curUrl = window.location;
let url = new URL(curUrl);
let searchParams = new URLSearchParams(url.search);
let curMark = eval(searchParams.get("curMark"));
console.log(curUrl + " -> " + searchParams.get("curObject"));

var myMap;
ymaps.ready(init);

const objectsButton = document.querySelector("#objectsButton");
const objectsButtonMenu = document.querySelector(".button-menu");
const objectsButtonMenuList = document.querySelector(".button-menu__list");

// add layer on map
function init() {
  getLayers();

  var myMap = new ymaps.Map(
    "map",
    {
      center: [55.76, 37.64],
      zoom: 10,
    },
    {
      searchControlProvider: "yandex#search",
    }
  );

  var objectManager = new ymaps.ObjectManager({
    clusterize: true,
  });

  if (searchParams.get("curObject")) {
    var curObject = JSON.parse(searchParams.get("curObject"));
    var curGeoObject = prepareObject(curObject);
    if (curGeoObject !== undefined) myMap.geoObjects.add(curGeoObject);
  } else {
    console.info("В get-запросе не найден объект для отображения");
  }

  myMap.geoObjects.add(objectManager);

  objectsButton.addEventListener(
    "click",
    (event) => {
      // console.log(event);
      const evtTarget = event.target;
      if (evtTarget.localName == "li") {
        event.stopPropagation();
        toggleResult = evtTarget.classList.toggle("button-menu__item_active");
        if (toggleResult) {
          showLayer(evtTarget.dataset.layerUrl, objectManager);
        } else {
          hideLayer(evtTarget.dataset.layerUrl, objectManager);
        }
      } else {
        objectsButton.classList.toggle("button_toggled");
        objectsButtonMenu.classList.toggle("button-menu_hidden");
      }
    },
    false
  );
}

function getLayers() {
  $.ajax({
    url: "./uploads/00_layers_ind.json",
  }).done(function (data) {
    // console.log(data);
    let itemsTempl = "";
    for (let item of data.layers) {
      itemsTempl += `<li class="button-menu__item" data-layer-url="${item.layUrl}">${item.name}</li>`;
      // console.log(item);
    }
    objectsButtonMenuList.innerHTML = itemsTempl;
  });
}

function showLayer(layerUrl = "", objectManager) {
  if (layerUrl == "") return;
  $.ajax({ url: layerUrl }).done(function (data) {
    // console.log(data);
    objectManager.add(data);
  });
}

function hideLayer(layerUrl = "", objectManager) {
  if (layerUrl == "") return;
  $.ajax({ url: layerUrl }).done(function (data) {
    // console.log(data);
    objectManager.remove(data);
  });
}

function prepareObject(curObject) {
  const allowedTypes = ["polyline", "polygon"];
  // http://127.0.0.1:5500/index.html?curObject={%22type%22:%22polygon%22,%20%22coords%22:[[55.80,37.50],[55.80,37.40],[55.70,37.50],[55.70,37.40]],%22name%22:%22%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B9%20%D0%BF%D0%BE%D0%BB%D0%B8%D0%B3%D0%BE%D0%BD%22}
  if (!curObject || !allowedTypes.includes(curObject.type))
    return console.error(
      "Ошибка преобразования в геообъект объекта",
      curObject
    );

  const objectType = curObject.type;
  if (objectType === "polyline") {
    return new ymaps.Polyline(
      // Указываем координаты вершин ломаной.
      curObject.coords,
      {
        // Содержимое балуна.
        balloonContent: curObject.name,
      },
      {
        // Задаем опции геообъекта.
        // Отключаем кнопку закрытия балуна.
        balloonCloseButton: false,
        // Цвет линии.
        strokeColor: "#345543",
        // Ширина линии.
        strokeWidth: 4,
        // Коэффициент прозрачности.
        strokeOpacity: 0.8,
      }
    );
  } else if (objectType == "polygon") {
    return new ymaps.GeoObject(
      {
        // Описываем геометрию геообъекта.
        geometry: {
          // Тип геометрии - "Многоугольник".
          type: "Polygon",
          // Указываем координаты вершин многоугольника.
          coordinates: [
            // Координаты вершин внешнего контура.
            curObject.coords,
          ],
          // Задаем правило заливки внутренних контуров по алгоритму "nonZero".
          fillRule: "nonZero",
        },
        // Описываем свойства геообъекта.
        properties: {
          // Содержимое балуна.
          balloonContent: "Многоугольник",
        },
      },
      {
        // Описываем опции геообъекта.
        // Цвет заливки.
        fillColor: "#009900",
        // Цвет обводки.
        strokeColor: "#000055",
        // Общая прозрачность (как для заливки, так и для обводки).
        opacity: 0.6,
        // Ширина обводки.
        strokeWidth: 4,
        // Стиль обводки.
        strokeStyle: "solid",
      }
    );
  } else {
    return;
  }
}
