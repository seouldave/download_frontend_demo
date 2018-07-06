
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
			if (value == 'Freehand') {
				draw = new ol.interaction.Draw({
					source: source,
					type: 'Polygon',
					freehand: true
				});
				map.addInteraction(draw);
			} else {
			draw = new ol.interaction.Draw({
				source: source,
				type: value
			});
			map.addInteraction(draw);
			}
		}
	}

	typeSelect.onchange = function() {
		map.removeInteraction(draw);
		addInteraction();
	};

	addInteraction();


	/*
	* Function to remove drawn layer ----------------> make sure this doesn't interfere with vector
	*/
	$(document).ready(function() {
		$("#clearMap").on('click', function() {
			vector.getSource().clear();
		});
	});


	//Click submit button and send coords to server.
	$("#submit").on('click', function() {
		var features = vector.getSource().getFeatures();
		var feature = features[0];
		var coord = feature.getGeometry().getCoordinates();
		console.log(coord);
		var JSONQury = {};
		var results = [];

		for (var i = 0; i < coord[0].length - 1; i++) {
			var c1 = ol.proj.transform(coord[0][i], 'EPSG:3857', 'EPSG:4326');

			results.push({"lon": c1[0],
						"lat": c1[1]
					});
		};
		console.log(results);

		var outputRequest; //value for radio button -> write conditional to check what it is and call appropriate ajax funtion
		getRaster(results);

	});

	function getRaster(results) {
		$.ajax({
			url: "http://10.19.101.223/wpgetdata/openlayer/get_raster.php",
			type: "post",
			data: {
				JSONstringify: JSON.stringify(results)
			},
			beforeSend: function() {
				//IS THIS NEEDED?
				console.log(results);
			},
			success: function(data) {
				try{
					var json = $.parseJSON(data);
					var status = json.status;
					console.log("SUCCESS" + json);
					switch (status)
					{
						case 1:
						console.log("GOOD");
						window.location = 'http://10.19.101.223/wpgetdata/openlayer/get_raster_file.php?JSONstringify=' + json.output;
						console.log(json);
						break;
						case 2:
						console.log("There was an error.1");
						break
						case 3:
						console.log("There was an error.2");
						break;
						default:
						console.log('There was an error.3');
						break;
					}
				} catch(e) {
					console.log(e);
				}
			},
			error:function(){
				console.log('There was an error.5');
			}
		});
	};


	$(document).ready(function() {
		$(document).ajaxStart(function() {
			$("#wait").css("display", "inline-block");
			$("#interface :input").prop("disabled", true);
		});

		$(document).ajaxStop(function() {
			$("#wait").css("display", "none");
			$("#interfac :input").attr("disabled", false);
		});
	});

}

/*TODO:
* If input is circle, how can it be extracted on circle - find way to get centre and radius.
* Calculate area of polygon
* Add shapefile/geojson
*
*
*/