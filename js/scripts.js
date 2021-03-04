mapboxgl.accessToken = 'pk.eyJ1Ijoia25hbmFuIiwiYSI6ImNrbDlsMXNmNjI3MnEyb25yYjNremFwYXQifQ.l6loLOR-pOL_U2kzWBSQNQ';

// 1. Initialize mapboxgl map and insert into mapcontainer div:
var map = new mapboxgl.Map({
  container: 'mapcontainer', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-73.984, 40.7128], // starting position [lng, lat]
  zoom: 10 // starting zoom
});

// add navigation control:
map.addControl(new mapboxgl.NavigationControl({
  showCompass: false,
  showZoom: true
}));

map.on('style.load', function () {
  // add a geojson source
  map.addSource('proximity-data', {
    type: 'geojson',
    data: 'data/subway-park-prox-data-v5.geojson'
  });

  // add layers for each variable in the data source with default 'visibility': 'none'
  map.addLayer({
    'id': 'park-prox-layer',
    'type': 'fill',
    'source': 'proximity-data',
    'layout': {
      'visibility': 'none'
    },
    'paint': {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'prox_park_pct'],
        0,'rgba(255,0,0,0)',
        20,'rgba(255,0,0,0.2)',
        40,'rgba(255,0,0,0.4)',
        60,'rgba(255,0,0,0.6)',
        80,'rgba(255,0,0,0.8)',
        100, 'rgba(255,0,0,1)'
      ],
      'fill-opacity': 0.8
    }
  });

  map.addLayer({
    'id': 'subway-prox-layer',
    'type': 'fill',
    'source': 'proximity-data',
    'layout': {
      'visibility': 'visible'
    },
    'paint': {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'prox_subway_pct'],
        0,'rgba(0,0,255,0)',
        20,'rgba(0,0,255,0.2)',
        40,'rgba(0,0,255,0.4)',
        60,'rgba(0,0,255,0.6)',
        80,'rgba(0,0,255,0.8)',
        100, 'rgba(0,0,255,1)'
      ],
      'fill-opacity': 0.8
    }
  });

  // add an empty data source, which we will use to highlight the CD that the user is hovering over
  map.addSource('highlight-feature', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  // add a layer for the highlighted lot
  map.addLayer({
    id: 'highlight-cd',
    type: 'line',
    source: 'highlight-feature',
    paint: {
      'line-width': 2,
      'line-opacity': 0.9,
      'line-color': 'black',
    }
  });

});

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

map.on('mousemove', function (e) {
  // query for the features under the mouse in both layers:
  var features = map.queryRenderedFeatures(e.point, {
      layers: ['park-prox-layer', 'subway-prox-layer'],
  });

  // if only one layer is selected by the user, we want to populate the popup with only the data from that layer:
  if (features.length == 1) {
    var hoveredFeature = features[0];
    var cd_name = hoveredFeature.properties.Region_Name;
    // if it is the mobile-dep layer use that data
    if (features[0].layer.id === 'park-prox-layer') {
      var park_prox_pct = hoveredFeature.properties.prox_park_pct;
      var popupContent = `
        <div style = "font-family:sans-serif; font-size:14px; font-weight:bold">${cd_name}</div>
        <div style = "font-family:sans-serif; font-size:12px; font-weight:600">Park Prox: ${park_prox_pct}% </div>
      `;
      popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
      // set this lot's polygon feature as the data for the highlight source
      map.getSource('highlight-feature').setData(hoveredFeature.geometry);
    } else if (features[0].layer.id === 'subway-prox-layer') {
        var subway_prox_pct = hoveredFeature.properties.prox_subway_pct;
        var popupContent2 = `
          <div style = "font-family:sans-serif; font-size:14px; font-weight:bold">${cd_name}</div>
          <div style = "font-family:sans-serif; font-size:12px; font-weight:600">Station Prox: ${subway_prox_pct}%</div>
        `;
        popup.setLngLat(e.lngLat).setHTML(popupContent2).addTo(map);
        // set this lot's polygon feature as the data for the highlight source
        map.getSource('highlight-feature').setData(hoveredFeature.geometry);
      }
    map.getCanvas().style.cursor = 'pointer';

  } else if (features.length == 2) {
      var subway_layer = features[0];   //subway layer is always first, then park, regardless of order in which buttons are clicked
      var park_layer = features[1];
      var cd_name2 = subway_layer.properties.Region_Name;
      var park_prox_pct2 = park_layer.properties.prox_park_pct;
      var subway_prox_pct2 = subway_layer.properties.prox_subway_pct;
      var popupContent3 = `
        <div style = "font-family:sans-serif; font-size:14px; font-weight:bold">${cd_name2}</div><br/>
        <div style = "font-family:sans-serif; font-size:12px; font-weight:600">Park Prox: ${park_prox_pct2}%</div>
        <div style = "font-family:sans-serif; font-size:12px; font-weight:600">Station Prox: ${subway_prox_pct2}%</div>
      `;
      popup.setLngLat(e.lngLat).setHTML(popupContent3).addTo(map);
      // set this lot's polygon feature as the data for the highlight source
      map.getSource('highlight-feature').setData(subway_layer.geometry);
      map.getCanvas().style.cursor = 'pointer';

    }  else {
    // remove the Popup
    popup.remove();
    map.getCanvas().style.cursor = '';
    map.getSource('highlight-feature').setData({
      'type': 'FeatureCollection',
      'features': []
    });
  }

});

$('.park-button').click(function () {
  if (map.getLayoutProperty('park-prox-layer', 'visibility') === 'none') {
    $('.park-button').addClass("selected-park-button-class");
    $('#park-legend-vals').css('visibility','visible');
    map.setLayoutProperty('park-prox-layer', 'visibility','visible');
  }
  else if (map.getLayoutProperty('park-prox-layer', 'visibility') === 'visible') {
    $('.park-button').removeClass('selected-park-button-class');
    $('#park-legend-vals').css('visibility','hidden');
    map.setLayoutProperty('park-prox-layer', 'visibility','none');
  }
});

$('.subway-button').click(function () {
  if (map.getLayoutProperty('subway-prox-layer', 'visibility') === 'none') {
    $('.subway-button').addClass("selected-subway-button-class");
    $('#subway-legend-vals').css('visibility','visible');
    map.setLayoutProperty('subway-prox-layer', 'visibility','visible');
  }
  else if (map.getLayoutProperty('subway-prox-layer', 'visibility') === 'visible') {
    $('.subway-button').removeClass("selected-subway-button-class");
    $('#subway-legend-vals').css('visibility','hidden');
    map.setLayoutProperty('subway-prox-layer', 'visibility','none');
  }
});
