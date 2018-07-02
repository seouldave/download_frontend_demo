
/*
* Function to initialise map
*/
function initialiseMap() {

	/*OSM tile layer*/
	var OSMTiles = new ol.layer.Tile({
		title: 'Open Street Map',
		source: new ol.source.OSM(),
		projection: 'EPSG:4326'
	});

	var source = new ol.source.Vector({wrapX: false,projection : 'EPSG:4326'});

	/*vector layer to hold added shape*/
	var vector = new ol.layer.Vector({
		source: source,
		projection: 'EPSG:4326'
	})

	var mapLayers = [OSMTiles, vector];

	var map = new ol.Map({
		target: 'map',
		projection: 'EPSG:4326',
		layers: mapLayers,
		view: new ol.View({
			center: [841240, 283949],
			zoom: 3,
			minZoom: 2
		})
	});

	/*Function to enable chosen data source*/
	$(document).ready(function() {
		$("#dataSourceSelect").on("change", function() {
			var dataSource = $(this).find("option:selected").attr("id");
			if (dataSource == "covariate_layer") {
				/*MAKE COVARIATE menu active*/
				$("#covariateSelect").prop('data-hide-disabled: true');
				console.log($("#covariateSelect").prop())
			} else if (dataSource == "population_density_layer") {
				$("#sexSelect").prop('disabled', false);
				$("#ageSelect").prop('disabled', false);
			}
		});
	});

}