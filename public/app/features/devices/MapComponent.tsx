import * as _ from 'lodash';
import React from 'react';
import { PureComponent } from 'react';
import * as L from './libs/leaflet';

const tileServers = {
  'CartoDB Positron': {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
  },
  'CartoDB Dark': {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
  },
};
const defaultCircleColor = 'rgba(245, 54, 54, 0.9)';
const defaultCircleRadius = 3;

export interface Props {
  latitude: number;
  longitude: number;
}

export class MapComponent extends PureComponent<Props, any> {
  data: any;
  mapContainer: any;
  circles: any[];
  map: any;
  circlesLayer: any;

  render() {
    this.data = [
      {
        key: 'k',
        locationLatitude: this.props.latitude,
        locationLongitude: this.props.longitude,
      },
    ];
    this.circles = [];

    this.createMap();

    return null; //this.mapContainer;
  }

  createMap() {
    const mapCenter = (window as any).L.latLng(
      parseFloat(this.data[0].locationLatitude),
      parseFloat(this.data[0].locationLongitude)
    );
    this.mapContainer = <div></div>;
    this.map = L.map(this.mapContainer, {
      worldCopyJump: true,
      preferCanvas: true,
      center: mapCenter,
      zoom: 1,
    });
    this.setMouseWheelZoom(true);

    const selectedTileServer = tileServers['CartoDB Dark'];
    (window as any).L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution,
    }).addTo(this.map);
  }

  needToRedrawCircles(data: any) {
    if (this.circles.length === 0 && data.length > 0) {
      return true;
    }

    if (this.circles.length !== data.length) {
      return true;
    }

    const locations = _.map(_.map(this.circles, 'options'), 'location').sort();
    const dataPoints = _.map(data, 'key').sort();
    return !_.isEqual(locations, dataPoints);
  }

  clearCircles() {
    if (this.circlesLayer) {
      this.circlesLayer.clearLayers();
      this.removeCircles();
      this.circles = [];
    }
  }

  drawCircles() {
    const data = this.data;
    if (this.needToRedrawCircles(data)) {
      this.clearCircles();
      this.createCircles(data);
    } else {
      this.updateCircles(data);
    }
  }

  createCircles(data: any) {
    const circles: any[] = [];
    data.forEach((dataPoint: any) => {
      circles.push(this.createCircle(dataPoint));
    });
    this.circlesLayer = this.addCircles(circles);
    this.circles = circles;
  }

  updateCircles(data: any) {
    data.forEach((dataPoint: any) => {
      const circle = _.find(this.circles, cir => {
        return cir.options.location === dataPoint.key;
      });

      if (circle) {
        circle.setRadius(defaultCircleRadius);
        circle.setStyle({
          color: defaultCircleColor,
          fillColor: defaultCircleColor,
          fillOpacity: 0.5,
          location: dataPoint.key,
        });
      }
    });
  }

  createCircle(dataPoint: any) {
    const circle = (window as any).L.circleMarker([dataPoint.locationLatitude, dataPoint.locationLongitude], {
      radius: defaultCircleRadius,
      color: defaultCircleColor,
      fillColor: defaultCircleColor,
      fillOpacity: 0.5,
      location: dataPoint.key,
    });

    return circle;
  }

  resize() {
    this.map.invalidateSize();
  }

  setMouseWheelZoom(enable: boolean) {
    if (!enable) {
      this.map.scrollWheelZoom.disable();
    } else {
      this.map.scrollWheelZoom.enable();
    }
  }

  addCircles(circles: any) {
    return (window as any).L.layerGroup(circles).addTo(this.map);
  }

  removeCircles() {
    this.map.removeLayer(this.circlesLayer);
  }

  setZoom(zoomFactor: any) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

  remove() {
    this.circles = [];
    if (this.circlesLayer) {
      this.removeCircles();
    }
    this.map.remove();
  }
}
