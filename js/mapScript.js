
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
				//enable covariate to select menu
				$("#covariateSelect").prop('disabled', false);
				$("#covariateSelect").selectpicker('refresh');

				//keep other menus disabled
				$("#sexSelect").prop('disabled', true);
				$("#ageSelect").prop('disabled', true);
				$("#yearSelect").prop('disabled', true);

				//set default value of menus
				$("#sexSelect").val('Select sex');
				$("#ageSelect").val('Select age group');
				$("#yearSelect").val('Select year');

				//Refresh menu state based on selections
				$("#sexSelect").selectpicker('refresh');
				$("#ageSelect").selectpicker('refresh');
				$("#yearSelect").selectpicker('refresh');

			} else if (dataSource == "population_density_layer") {
				//enable covariate to select menu
				$("#sexSelect").prop('disabled', false);
				$("#sexSelect").selectpicker('refresh');

				//keep other menus disabled
				$("#covariateSelect").prop('disabled', true);
				$("#ageSelect").prop('disabled', true);
				$("#yearSelect").prop('disabled', true);

				//set default values for menus
				$("#covariateSelect").val('Select covariate');				
				$("#ageSelect").val('Select age group');
				$("#yearSelect").val('Select year');
				
				$("#ageSelect").selectpicker('refresh');
				$("#covariateSelect").selectpicker('refresh');
				$("#yearSelect").selectpicker('refresh');
 
			};
		}); //end of #dataSourceSelect menu select logic

		//Function to choose covariate type
		$("#covariateSelect").on("change", function() {
			if ($(this).find("option:selected").attr("id") != "no_covariate_selected") {
				var covariateSelect = $(this).find("option:selected").attr("id"); //set variable for covariate choice
				$("#yearSelect").prop('disabled', false);
				$("#yearSelect").selectpicker('refresh');

			}
			
		}); //end of #covariateSelect menu select logic

		//Function to choose sex
		$("#sexSelect").on("change", function() {
			if ($(this).find("option:selected").attr("id") != "no_sex_chosen") {
				var sexSelect = $(this).find("option:selected").attr("id");
				$("#ageSelect").prop('disabled', false);
				$("#ageSelect").selectpicker('refresh');
			}

		}) //end of #sexSelect menu select logic

		//Function to choose population age group
		$("#ageSelect").on("change", function() {
			if ($(this).find("option:selected").attr("id") != "no_age_selected") {
				var ageSelect = $(this).find("option:selected").attr("id");				
				$("#yearSelect").prop('disabled', false);
				$("#yearSelect").selectpicker('refresh');
			}
		}); //end of #ageSelect menu select logic
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
		if (value != 'None') {
			if (value == 'Freehand') {
				draw = new ol.interaction.Draw({
					source: source,
					type: 'Polygon',
					freehand: true
				});
				map.addInteraction(draw);
			//Convert circle into geojson polygon
			} else if (value == 'Circle') {
				draw = new ol.interaction.Draw({
					source: source,
					type: value,
					geometryFunction: function(coordinates, geometry) {
						if (!geometry) {
							geometry = new ol.geom.Polygon(null);
						}
						var center = coordinates[0];
						var last = coordinates[1];
						var dx = center[0] - last[0];
						var dy = center[1] - last[1];
						var radius = Math.sqrt(dx * dx + dy * dy);
						var circle = ol.geom.Polygon.circular(ol.proj.toLonLat(center), radius);
						circle.transform('EPSG:4326', 'EPSG:3857');
						geometry.setCoordinates(circle.getCoordinates());
						return geometry;
					}
				})
				map.addInteraction(draw);
			} else { //Drawing will not be freehand ie Polygon or Circle
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


	$(document).ready(function() {
		$("#clearMap").on('click', function() {
			vector.getSource().clear();
		});
	});


	//Click submit button and send coords to server.
	$("#submit").on('click', function() {
		////////////////////////////////////Get vector source in Geojson
		var features = vector.getSource().getFeatures();
		
		if (features.length == 0) {
			$("#noPictureError").modal();
			$("#noPictureErrorMessage").html("<p><strong>Please draw your area of interest on the map.</strong></p>")
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
		//Limit the size of the input area ----> Currently at 100km^2. This needs to be increased.
		if (feature.getGeometry().getArea() >= 10000000000) {
			area = feature.getGeometry().getArea();
			$("#areaError").modal();
			$("#areaErrorMessage").html("<p><b>Sorry, your polygon's area is too large. Your polygon is " + (Math.round(area/100000000)) + "km<sup>2</sup>. Please draw a polygon 100km<sup>2</sup> or less");
			return;
		}
		var writer = new ol.format.GeoJSON();
		var geojsonStr = writer.writeFeatures(features);
		var geojson = JSON.parse(geojsonStr);
		var coord = feature.getGeometry().getCoordinates();
		var JSONQury = {};
		var results = [];

		//Transform Transverse mercator coords to WGS84 coords
		for (var i = 0; i < coord[0].length; i++) {
			var c1 = ol.proj.transform(coord[0][i], 'EPSG:3857', 'EPSG:4326');
			results.push(c1);
		};

		//Geojson object's coords couldn't be transformed so coordinates replaced here using above created array
		for (var i = 0; i < results.length; i++){
			geojson.features[0].geometry.coordinates[i] = results[i];
		}

		//Define variables ----->
		var $items = $("#dataSourceSelect, #covariateSelect, #ageSelect, #sexSelect, #yearSelect");
		postObj = {} //Json object in which shape and variables will be posted
		$items.each(function() {
    			postObj[this.id] = $(this).find("option:selected").attr("id");
   		});
   		postObj.geojson = geojson;
   		console.log(JSON.stringify(postObj));
   		//////////////////////////////////START HERE 22/08/2018/////////////////////////
		//Finished defining variables <-------
		



		var outputRequest = $("#outputSelect :checked").val(); //value for radio button ->  conditional checks what it is and call appropriate ajax funtion (SEE getRaster() and getZonalStats())
		if (outputRequest == "raster"){
			getRaster(results);;
		} else if (outputRequest == "zonalStats") {
			getZonalStats(results);
		} else {
			$("#outputTypeError").modal();
			$("#outputTypeErrorMessage").html("<p>Please select an output type (Check <b>'Raster' or 'Zonal Statistics'</b> and the bottom of the menu.)</p>");
		}

	});

	/*function getRaster(results) {
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
*/

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