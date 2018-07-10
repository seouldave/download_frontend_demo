
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

	//TESTING VARIABLE FOR JSON OUTPUT DATA --> DELETE AFTER TESTING
	//result_test = {"status":1,"message":null,"output":"\"\",\"mean\",\"min\",\"max\",\"sum\"\n\"1\",0.748299319727891,0,11,220\n"}

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
		if (features.length == 0) {
			alert("DRAW a picture");
			return;
		}
		if (features.length > 1) {
			var feature = features[features.length - 1];
			for (var i=0; i < features.length -1; i++) {
				vector.getSource().removeFeature(features[i]); //removes all features drawn except last one.
			}
		} else {
			var feature = features[0]
		};
		if (feature.getGeometry().getArea() >= 100000000) {
			area = feature.getGeometry().getArea();
			//alert('Sorry, your polygon\'s area is too large. Your polygon is ' + area/1000 + '. Please draw a polygon 10 or less.');
			$("#areaError").modal();
			$("#areaErrorMessage").html("<p><b>Sorry, your polygon's area is too large. You polygon is " + (Math.round(area/1000000)) + "km<sup>2</sup>. Please draw a polygon 100km<sup>2</sup> or less");
			return;
		}
		console.log(feature.getGeometry().getArea());
		var coord = feature.getGeometry().getCoordinates();
		var JSONQury = {};
		var results = [];

		for (var i = 0; i < coord[0].length - 1; i++) {
			var c1 = ol.proj.transform(coord[0][i], 'EPSG:3857', 'EPSG:4326');

			results.push({"lon": c1[0],
						"lat": c1[1]
					});
		};
		console.log(results);

		var outputRequest = $("#outputSelect :checked").val(); //value for radio button ->  conditional checks what it is and call appropriate ajax funtion (SEE getRaster() and getZonalStats())
		if (outputRequest == "raster"){
			getRaster(results);;
		} else if (outputRequest == "zonalStats") {
			getZonalStats(results);
		} else {
			alert('Please select an output type (Raster or Zonal Statistics)');
		}

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

	function getZonalStats(results) {
		 $.ajax({
                url: "http://10.19.101.223/wpgetdata/openlayer/get.php",
                type: "post",
                data: {
                    JSONstringify: JSON.stringify(results)
                },
                beforeSend: function(){
                },                           
                success: function(data){
                    try{		
                        var json = $.parseJSON(data);
                        var status = json.status;
                        switch (status)
                        {
                            case 1:
								resultArray = json.output.split(',');
								resultArray.unshift(1);
								//MAKE TABLE TO BE SHOWN IN MODAL
								$("#resultsModal").modal();
								$("#mean").text(parseFloat(resultArray[6]).toFixed(4));
								$("#min").text(resultArray[7]);
								$("#max").text(resultArray[8]);
								$("#sum").text(resultArray[9]);								
                                break;
                            case 2:
                                console.log('There was an error.1');
                                break;
                            case 3:
                                console.log('There was an error.2');
                                break;                                
                            default:
                                console.log('There was an error.3');
                                break;
                        }
                    }catch(e) {	
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
			$("#interface :input").attr("disabled", false);
		});
	});

	//function to show instructions
	$("#showInstructions").click(function() {
		$("#instructionsModal").modal();
	})

}

/*TODO:
* If input is circle, how can it be extracted on circle - find way to get centre and radius.
* Calculate area of polygon
* Add shapefile/geojson
*
*
*/