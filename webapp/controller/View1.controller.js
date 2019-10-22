sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("LMBR_CUSTOMER_APP.queue_analysis.controller.View1", {

		/*----------------------------------------------------
		Function: onInit
		Target: Executed when Applications was started
		----------------------------------------------------*/
		onInit: function () {

			/*----------------------------------------------------
			Object: _localData
			Object to agrouped all fields for Chart Control
			----------------------------------------------------*/
			var _Settings = {

				// Seconds for Auto Refresh
				refreshSeconds: 20,

				// Auto Refresh Switch
				autoRefresh: false,

				// Profile
				profile: "A",

				// Include Empty Queues
				includeEmptyQueues: true,

				// Last Date/Time Data
				lastDateTime: null,

				// Busy Indicator
				busyIndicator: true
			};

			/*----------------------------------------------------
			Object: _chartConfig
			Object to agrouped all fields for Chart Control
			----------------------------------------------------*/
			var _chartProperties = {

				//--------------------------
				// Chart 01 Properties
				//--------------------------
				vizPropertiesChart01: {
					title: {
						text: "Queues"
					},

					plotArea: {
						colorPalette: ["#BB0000", "#E78C07", "#2B7D2B", "#3F5161"],
						dataLabel: {
							hideWhenOverlap: true,
							visible: false
						},

						background: {
							color: "transparent"

						},

						dataShape: {
							primaryAxis: ["bar", "bar", "bar", "line"]
						}

					},

					legend: {
						title: {
							visible: false
						}

					},
					legendGroup: {
						layout: {
							position: "top"
						}
					},
					categoryAxis: {
						title: {
							text: "Queues",
							visible: false
						}
					},
					valueAxis: {
						title: {
							visible: false
						}
					}
				},

				//--------------------------
				// Chart 02 Properties
				//--------------------------
				vizPropertiesChart02: {
					title: {
						text: "Queues - Warning"
					},

					plotArea: {
						colorPalette: ["#E78C07"],
						dataLabel: {
							visible: true
						},

						background: {
							color: "transparent"
						}
					},

					legend: {
						title: {
							visible: false
						}

					},
					legendGroup: {
						layout: {
							position: "top"
						}
					},
					categoryAxis: {
						title: {
							text: "Queues Warning",
							visible: false
						}
					},
					valueAxis: {
						title: {
							visible: false
						}
					}
				},

				//--------------------------
				// Chart 03 Properties
				//--------------------------
				vizPropertiesChart03: {
					title: {
						text: "Queues - Error"
					},

					plotArea: {
						colorPalette: ["#BB0000"],
						dataLabel: {
							visible: true
						},

						background: {
							drawingEffect: "glossy",
							gradientDirection: "vertical",
							color: "#ff3333"
						}

					},

					legend: {
						title: {
							visible: false
						}

					},
					legendGroup: {
						layout: {
							position: "top"
						}
					},
					categoryAxis: {
						title: {
							text: "Queues Error",
							visible: false
						}
					},
					valueAxis: {
						title: {
							visible: false
						}
					}
				}
			};

			// Muda Títulos dos gráficos baseado em arquivo i18n
			_chartProperties.vizPropertiesChart01.title.text = this.getView().getModel("i18n").getProperty("ChartQtyLimits");
			_chartProperties.vizPropertiesChart02.title.text = this.getView().getModel("i18n").getProperty("ChartWarning");
			_chartProperties.vizPropertiesChart03.title.text = this.getView().getModel("i18n").getProperty("ChartErrors");

			// Generate JSONModel for ChartSettings
			var oJsonModelChart = new JSONModel();
			oJsonModelChart.setProperty("/Properties", _chartProperties);
			oJsonModelChart.setProperty("/Settings", _Settings);
			this.getView().setModel(oJsonModelChart, "Chart");

			// Create Interval Trigger for Auto Refresh, if enabled 
			// Initially without auto refresh
			self = this;
			self.IntervalTrigger = new sap.ui.core.IntervalTrigger(0);
			self.IntervalTrigger.addListener(function () {
				self.autoRefresh();
			});

			// Get Chart Data first time
			self._getChartData();

		},

		/*----------------------------------------------------
		Function: autoRefresh
		Target: Function for Auto Refresh Logic, started after 
				each X seconds
		----------------------------------------------------*/
		autoRefresh: function () {
			MessageToast.show(this.getView().getModel("i18n").getProperty("MessageSelectedData"), {
				duration: 500,
				at: "sap.ui.core.Popup.Dock.CenterCenter"
			});
			this._getChartData();
		},

		/*----------------------------------------------------
		Function: handleAutoRefresh
		Target: Function when "Auto Refresh" switch was changed
		----------------------------------------------------*/
		handleAutoRefresh: function (oControlEvent) {

			// JSon model
			var oJsonModel = this.getView().getModel("Chart");

			// Check if Auto Refresh is Activated
			if (oControlEvent.getParameters().state === true) {

				// Get Seconds Informed and redefine new interval for refresh data
				var sSeconds = oJsonModel.getProperty("/Settings/refreshSeconds");
				sSeconds = sSeconds * 1000;

				// Set Interval Refresh Data
				this.IntervalTrigger.setInterval(sSeconds);

			} else {
				this.IntervalTrigger.setInterval(0);
			}

		},

		/*----------------------------------------------------
		Function: handleSettingsPress
		Target: Function when "Settings" buttons was clicked
		----------------------------------------------------*/
		handleSettingsPress: function (oEvent) {

			if (!this.settingsFragment) {
				this.settingsFragment = sap.ui.xmlfragment(this.getView().getId(), "LMBR_CUSTOMER_APP.queue_analysis.view.View1-Settings", this);
				this.getView().addContent(this.settingsFragment);
			}
			this.settingsFragment.open();

		},

		/*----------------------------------------------------
		Function: handleInfoPress
		Target: Function when "Settings" buttons was clicked
		----------------------------------------------------*/
		handleInfoPress: function (oEvent) {

			if (!this.infoFragment) {
				this.infoFragment = sap.ui.xmlfragment(this.getView().getId(), "LMBR_CUSTOMER_APP.queue_analysis.view.View1-Info", this);
				this.getView().addContent(this.infoFragment);
			}
			this.infoFragment.open();

		},

		/*----------------------------------------------------
		Function: handleClosePress
		Target: Function when "Settings" or "Info" close buttons was clicked
		----------------------------------------------------*/
		handleClosePress: function (oEvent) {

			// If Settings Fragment is Opened
			if (this.settingsFragment) {
				this.settingsFragment.close();
			}

			// If Info Fragment is Opened
			if (this.infoFragment) {
				this.infoFragment.close();
			}

		},

		/*----------------------------------------------------
		Function: _getDataQueues
		Target: Get Data from Queues EntitySet
		----------------------------------------------------*/
		_getDataQueues: function (oDataModel, oJsonModel) {

			// Clear Content
			var oChartData = {
				Queues: [],
				WarningZone: [],
				ErrorZone: []
			};
			oJsonModel.setProperty("/ChartData", oChartData);

			// Callback para SUCCESS
			function onSuccess(oData, response) {

				// Disable Busy Indicator
				oJsonModel.setProperty("/Settings/busyIndicator", false);
				
				debugger;

				// Run all records returned
				for (var i = 0; i < oData.results.length; i++) {

					// Calculate Yellow Zone
					var _yellowZone = Number(oData.results[i].GreenZone) + Number(oData.results[i].YellowZone);
					var _qtyCurrent = Number(oData.results[i].Qty);

					// Queues Record
					if (oJsonModel.getProperty("/Settings/includeEmptyQueues"))
						oChartData.Queues.push(oData.results[i]);
					else if (_qtyCurrent > 0)
						oChartData.Queues.push(oData.results[i]);

					// Warning Zone Records
					if (_qtyCurrent > oData.results[i].GreenZone &&
						_qtyCurrent <= _yellowZone) {
						oChartData.WarningZone.push(oData.results[i]);

						// Error Zone Records
					} else if (_qtyCurrent > _yellowZone) {
						oChartData.ErrorZone.push(oData.results[i]);
					}

				}

				// Default Records for display Empty Chart
				if (oChartData.WarningZone.length <= 0)
					oChartData.WarningZone.push({});

				if (oChartData.ErrorZone.length <= 0)
					oChartData.ErrorZone.push({});

				// Refresh Chart Content
				oJsonModel.setProperty("/ChartData", oChartData);
			}

			// Callback para ERROR
			function onError(oError) {

				// Disable Busy Indicator
				oJsonModel.setProperty("/Settings/busyIndicator", false);

				MessageBox.alert("Erro on path '/Queues' :" + oError.responseText);

			}

			// Filter 
			var oFilters = [];
			oFilters.push(new sap.ui.model.Filter({
				path: "Profile",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: oJsonModel.getProperty("/Settings/profile")
			}));

			// Parameters
			var oParam = {

				filters: oFilters,

				// CallBack para Sucesso
				success: onSuccess.bind(this),
				error: onError.bind(this)

			};

			// Get Queues Content
			oDataModel.read("/Queues", oParam);

		},

		/*----------------------------------------------------
		Function: _getDataSystemsConfigs
		Target: Get Data from EntitySet
		----------------------------------------------------*/
		_getDataSystemsConfigs: function (oDataModel, oJsonModel) {

			// CallBack para Sucesso
			function onSuccess(oData, response) {
				oJsonModel.setProperty("/InfoSystemConfig", oData.results);
			}

			// CallBack para Erro
			function onError(oError) {
				MessageBox.alert("Erro na pesquisa dos dados da EntitySet '/SystemConfigs' :" + oError.responseText);

			}

			//----------------------------
			// Read Data from "/SystemConfigs" Entity Set
			//----------------------------
			var oParam_QUERY = {

				// CallBack para Sucesso
				success: onSuccess,
				error: onError

			};

			// Call QUERY on Entity Set Import on SAP Gateway
			oDataModel.read("/SystemConfigs", oParam_QUERY);

		},

		/*----------------------------------------------------
		Function: _getChartData
		Target: Function to get chart Data from Odata Model
		----------------------------------------------------*/
		_getChartData: function () {

			// Get Default Model from View (OData and JSONModel)
			var oDataModel = this.getView().getModel();
			var oJsonModel = this.getView().getModel("Chart");
			oJsonModel.setProperty("/Settings/lastDateTime", new Date().toLocaleString());

			// Enable Busy Indicator
			oJsonModel.setProperty("/Settings/busyIndicator", true);

			// Get Data BySystemsFI
			this._getDataQueues(oDataModel, oJsonModel);

			// Get Data SystemConfigs
			this._getDataSystemsConfigs(oDataModel, oJsonModel);

		}

	});
});