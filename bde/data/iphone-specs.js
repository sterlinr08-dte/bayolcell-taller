// Especificaciones por modelo (ProductType -> datos) para completar la ficha
// como hace 3uTools. Si no está el modelo, se usan solo los datos leídos.
(function (g) {
  const S = {
    // iPhone 6 / 6 Plus / 6s / 6s Plus / SE1
    'iPhone7,2': { nombre:'iPhone 6', chip:'A8', ram:'1 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'8 MP', anio:'2014' },
    'iPhone7,1': { nombre:'iPhone 6 Plus', chip:'A8', ram:'1 GB', pantalla:'5.5" 1920×1080', ppi:'401', camara:'8 MP', anio:'2014' },
    'iPhone8,1': { nombre:'iPhone 6s', chip:'A9', ram:'2 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'12 MP', anio:'2015' },
    'iPhone8,2': { nombre:'iPhone 6s Plus', chip:'A9', ram:'2 GB', pantalla:'5.5" 1920×1080', ppi:'401', camara:'12 MP', anio:'2015' },
    'iPhone8,4': { nombre:'iPhone SE (1ª gen)', chip:'A9', ram:'2 GB', pantalla:'4.0" 1136×640', ppi:'326', camara:'12 MP', anio:'2016' },
    // iPhone 7 / 7 Plus
    'iPhone9,1': { nombre:'iPhone 7', chip:'A10 Fusion', ram:'2 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'12 MP', anio:'2016' },
    'iPhone9,3': { nombre:'iPhone 7', chip:'A10 Fusion', ram:'2 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'12 MP', anio:'2016' },
    'iPhone9,2': { nombre:'iPhone 7 Plus', chip:'A10 Fusion', ram:'3 GB', pantalla:'5.5" 1920×1080', ppi:'401', camara:'12+12 MP', anio:'2016' },
    'iPhone9,4': { nombre:'iPhone 7 Plus', chip:'A10 Fusion', ram:'3 GB', pantalla:'5.5" 1920×1080', ppi:'401', camara:'12+12 MP', anio:'2016' },
    // iPhone 8 / 8 Plus / X
    'iPhone10,1': { nombre:'iPhone 8', chip:'A11 Bionic', ram:'2 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'12 MP', anio:'2017' },
    'iPhone10,4': { nombre:'iPhone 8', chip:'A11 Bionic', ram:'2 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'12 MP', anio:'2017' },
    'iPhone10,2': { nombre:'iPhone 8 Plus', chip:'A11 Bionic', ram:'3 GB', pantalla:'5.5" 1920×1080', ppi:'401', camara:'12+12 MP', anio:'2017' },
    'iPhone10,5': { nombre:'iPhone 8 Plus', chip:'A11 Bionic', ram:'3 GB', pantalla:'5.5" 1920×1080', ppi:'401', camara:'12+12 MP', anio:'2017' },
    'iPhone10,3': { nombre:'iPhone X', chip:'A11 Bionic', ram:'3 GB', pantalla:'5.8" OLED 2436×1125', ppi:'458', camara:'12+12 MP', anio:'2017' },
    'iPhone10,6': { nombre:'iPhone X', chip:'A11 Bionic', ram:'3 GB', pantalla:'5.8" OLED 2436×1125', ppi:'458', camara:'12+12 MP', anio:'2017' },
    // iPhone XS / XS Max / XR
    'iPhone11,2': { nombre:'iPhone XS', chip:'A12 Bionic', ram:'4 GB', pantalla:'5.8" OLED 2436×1125', ppi:'458', camara:'12+12 MP', anio:'2018' },
    'iPhone11,4': { nombre:'iPhone XS Max', chip:'A12 Bionic', ram:'4 GB', pantalla:'6.5" OLED 2688×1242', ppi:'458', camara:'12+12 MP', anio:'2018' },
    'iPhone11,6': { nombre:'iPhone XS Max', chip:'A12 Bionic', ram:'4 GB', pantalla:'6.5" OLED 2688×1242', ppi:'458', camara:'12+12 MP', anio:'2018' },
    'iPhone11,8': { nombre:'iPhone XR', chip:'A12 Bionic', ram:'3 GB', pantalla:'6.1" 1792×828', ppi:'326', camara:'12 MP', anio:'2018' },
    // iPhone 11 / Pro / Pro Max / SE2
    'iPhone12,1': { nombre:'iPhone 11', chip:'A13 Bionic', ram:'4 GB', pantalla:'6.1" 1792×828', ppi:'326', camara:'12+12 MP', anio:'2019' },
    'iPhone12,3': { nombre:'iPhone 11 Pro', chip:'A13 Bionic', ram:'4 GB', pantalla:'5.8" OLED 2436×1125', ppi:'458', camara:'12+12+12 MP', anio:'2019' },
    'iPhone12,5': { nombre:'iPhone 11 Pro Max', chip:'A13 Bionic', ram:'4 GB', pantalla:'6.5" OLED 2688×1242', ppi:'458', camara:'12+12+12 MP', anio:'2019' },
    'iPhone12,8': { nombre:'iPhone SE (2ª gen)', chip:'A13 Bionic', ram:'3 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'12 MP', anio:'2020' },
    // iPhone 12
    'iPhone13,1': { nombre:'iPhone 12 mini', chip:'A14 Bionic', ram:'4 GB', pantalla:'5.4" OLED 2340×1080', ppi:'476', camara:'12+12 MP', anio:'2020' },
    'iPhone13,2': { nombre:'iPhone 12', chip:'A14 Bionic', ram:'4 GB', pantalla:'6.1" OLED 2532×1170', ppi:'460', camara:'12+12 MP', anio:'2020' },
    'iPhone13,3': { nombre:'iPhone 12 Pro', chip:'A14 Bionic', ram:'6 GB', pantalla:'6.1" OLED 2532×1170', ppi:'460', camara:'12+12+12 MP', anio:'2020' },
    'iPhone13,4': { nombre:'iPhone 12 Pro Max', chip:'A14 Bionic', ram:'6 GB', pantalla:'6.7" OLED 2778×1284', ppi:'458', camara:'12+12+12 MP', anio:'2020' },
    // iPhone 13 / SE3
    'iPhone14,4': { nombre:'iPhone 13 mini', chip:'A15 Bionic', ram:'4 GB', pantalla:'5.4" OLED 2340×1080', ppi:'476', camara:'12+12 MP', anio:'2021' },
    'iPhone14,5': { nombre:'iPhone 13', chip:'A15 Bionic', ram:'4 GB', pantalla:'6.1" OLED 2532×1170', ppi:'460', camara:'12+12 MP', anio:'2021' },
    'iPhone14,2': { nombre:'iPhone 13 Pro', chip:'A15 Bionic', ram:'6 GB', pantalla:'6.1" OLED 120Hz 2532×1170', ppi:'460', camara:'12+12+12 MP', anio:'2021' },
    'iPhone14,3': { nombre:'iPhone 13 Pro Max', chip:'A15 Bionic', ram:'6 GB', pantalla:'6.7" OLED 120Hz 2778×1284', ppi:'458', camara:'12+12+12 MP', anio:'2021' },
    'iPhone14,6': { nombre:'iPhone SE (3ª gen)', chip:'A15 Bionic', ram:'4 GB', pantalla:'4.7" 1334×750', ppi:'326', camara:'12 MP', anio:'2022' },
    // iPhone 14
    'iPhone14,7': { nombre:'iPhone 14', chip:'A15 Bionic', ram:'6 GB', pantalla:'6.1" OLED 2532×1170', ppi:'460', camara:'12+12 MP', anio:'2022' },
    'iPhone14,8': { nombre:'iPhone 14 Plus', chip:'A15 Bionic', ram:'6 GB', pantalla:'6.7" OLED 2778×1284', ppi:'458', camara:'12+12 MP', anio:'2022' },
    'iPhone15,2': { nombre:'iPhone 14 Pro', chip:'A16 Bionic', ram:'6 GB', pantalla:'6.1" OLED 120Hz 2556×1179', ppi:'460', camara:'48+12+12 MP', anio:'2022' },
    'iPhone15,3': { nombre:'iPhone 14 Pro Max', chip:'A16 Bionic', ram:'6 GB', pantalla:'6.7" OLED 120Hz 2796×1290', ppi:'460', camara:'48+12+12 MP', anio:'2022' },
    // iPhone 15
    'iPhone15,4': { nombre:'iPhone 15', chip:'A16 Bionic', ram:'6 GB', pantalla:'6.1" OLED 2556×1179', ppi:'460', camara:'48+12 MP', anio:'2023' },
    'iPhone15,5': { nombre:'iPhone 15 Plus', chip:'A16 Bionic', ram:'6 GB', pantalla:'6.7" OLED 2796×1290', ppi:'460', camara:'48+12 MP', anio:'2023' },
    'iPhone16,1': { nombre:'iPhone 15 Pro', chip:'A17 Pro', ram:'8 GB', pantalla:'6.1" OLED 120Hz 2556×1179', ppi:'460', camara:'48+12+12 MP', anio:'2023' },
    'iPhone16,2': { nombre:'iPhone 15 Pro Max', chip:'A17 Pro', ram:'8 GB', pantalla:'6.7" OLED 120Hz 2796×1290', ppi:'460', camara:'48+12+12 MP', anio:'2023' },
    // iPhone 16
    'iPhone17,3': { nombre:'iPhone 16', chip:'A18', ram:'8 GB', pantalla:'6.1" OLED 120Hz 2556×1179', ppi:'460', camara:'48+12 MP', anio:'2024' },
    'iPhone17,4': { nombre:'iPhone 16 Plus', chip:'A18', ram:'8 GB', pantalla:'6.7" OLED 120Hz 2796×1290', ppi:'460', camara:'48+12 MP', anio:'2024' },
    'iPhone17,1': { nombre:'iPhone 16 Pro', chip:'A18 Pro', ram:'8 GB', pantalla:'6.3" OLED 120Hz 2622×1206', ppi:'460', camara:'48+48+12 MP', anio:'2024' },
    'iPhone17,2': { nombre:'iPhone 16 Pro Max', chip:'A18 Pro', ram:'8 GB', pantalla:'6.9" OLED 120Hz 2868×1320', ppi:'460', camara:'48+48+12 MP', anio:'2024' }
  };
  g.IPHONE_SPECS = S;
  g.specsDe = function (productType) { return S[productType] || null; };
})(typeof window !== 'undefined' ? window : global);
