
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

	/*Function to enable chosen data source
	* and create variable to be sent to server
	*/
	$(document).ready(function() {
		$("#dataSourceSelect").on("change", function() {
			var dataSource = $(this).find("option:selected").attr("id");
			if (dataSource == "covariate_layer") {
				$("#covariateSelect").prop('disabled', false);
				$("#covariateSelect").selectpicker('refresh');
				$("#sexSelect").prop('disabled', true);
				$("#ageSelect").prop('disabled', true);
				$("#sexSelect").val('Select sex');
				$("#ageSelect").val('Select age group')
				$("#sexSelect").selectpicker('refresh');
				$("#ageSelect").selectpicker('refresh');
			} else if (dataSource == "population_density_layer") {
				$("#sexSelect").prop('disabled', false);
				$("#ageSelect").prop('disabled', false);
				$("#sexSelect").selectpicker('refresh');
				$("#ageSelect").selectpicker('refresh');
				$("#covariateSelect").prop('disabled', true);
				$("#covariateSelect").val('Select covariate');
				$("#covariateSelect").selectpicker('refresh');
 
			};
		});
	});

	$(document).ready(function() {
		$(".nav-tabs a").click(function() {
			$(this).tab('show');
		});
	});

	var draw;
	var typeSelect = document.getElementById('type');

	function addInteraction() {
		var value = typeSelect.value;
		console.log(value);
		/*var value = typeSelect;*/
		if (value != 'None') {
			draw = new ol.interaction.Draw({
				source: source,
				type: value
			});
			map.addInteraction(draw);
		}
	}

	typeSelect.onchange = function() {
		map.removeInteraction(draw);
		addInteraction();
	};

	addInteraction();

}