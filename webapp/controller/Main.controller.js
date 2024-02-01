sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    'sap/m/MessageToast',
    'sap/ui/model/json/JSONModel',
    'sap/ui/export/Spreadsheet',
    'sap/ui/core/format/NumberFormat',
    "sap/m/MessageBox",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, DateFormat, MessageToast, JSONModel, Spreadsheet, NumberFormat, MessageBox) {
        "use strict";

        return Controller.extend("zmb51ui.controller.Main", {
            onInit: function () {
                // Scope definition
                const that = this
                // ****************** Smartfilterbar Logic starts here below ******************
                const oSmartTableFilter = this.getView().byId("smartFilterBar");
                oSmartTableFilter.attachSearch(function () {
                    console.log(sap.ui.getCore().byId('application-zmb51ui-display-component---Main--smartFilterBar-filterItemControlA_-Article-valueHelpDialog-smartFilterBar-filterItemControlA_-Matnr-valueHelpDialog'));

                    // Set the BusyDialog to true
                    const oDialog = that.getView().byId("BusyDialog");
                    oDialog.open();
                    // Get the values of filters
                    const sArticle = oSmartTableFilter.getFilterData().Article;
                    const sGrpMarchandise = oSmartTableFilter.getFilterData().GrpMarchandise;
                    const sDivision = oSmartTableFilter.getFilterData().Division;
                    const sMVT = oSmartTableFilter.getFilterData().MVT;
                    const sDateComptable = oSmartTableFilter.getFilterData().DateComptable;
                    console.log(sGrpMarchandise);
                    console.log(sArticle);
                    if (!sGrpMarchandise && !sArticle) { 
                        MessageBox.error(that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("errMsg"));
                        oDialog.close()
                        return;
                    }

                    // Prepare the filters
                    let Filters = new Array();
                    
                    sArticle && sArticle.items.map((e) => e.text).map((article) => {
                        Filters.push(
                            that._onGetFilters(article, "Article")
                        )
                    })
                    sGrpMarchandise && sGrpMarchandise.items.map((e) => e.text).map((grp) => {
                        Filters.push(
                            that._onGetFilters(grp, "GrpMarchandise")
                        )
                    })
                    sDivision && sDivision.items.map((e) => e.text).map((div) => {
                        Filters.push(
                            that._onGetFilters(div, "Division")
                        )
                    })
                    sMVT && sMVT.items.map((e) => e.text).map((mvt) => {
                        Filters.push(
                            that._onGetFilters(mvt, "MVT")
                        )
                    })
                    sDateComptable && Filters.push(
                        that._onGetFilters(sDateComptable, "DateComptable")
                    )

                    // READ DATA FROM THE SERVICE
                    const oModel = that.getOwnerComponent().getModel()
                    oModel.read('/ZCDS_CN_MSEG', {
                        filters: Filters,
                        success: function (oData) {
                            console.log(oData);
                            if (oData) {
                                // debugger
                                const jModel = new sap.ui.model.json.JSONModel(oData.results);
                                console.log(oData.results);
                                oData.results.map((entry) => {
                                    entry.DateComptable = that._formatDate(entry.DateComptable)
                                    entry.QteEnUQS = that._formatNumber(entry.QteEnUQS, 13, 2)
                                    entry.QteEnUQ = that._formatNumber(entry.QteEnUQ, 13, 3)
                                    entry.Quantite = that._formatNumber(entry.Quantite, 13, 3)
                                    entry.MontantAchat = Number(entry.MontantAchat) != 0 ? that._formatNumber(entry.MontantAchat, 13, 2) : ''
                                    entry.UQVar = Number(entry.UQVar) != 0 ? that._formatUQVar(entry.UQVar) : ''

                                    return entry;
                                })

                                // Sorting
                                oData.results.sort((a, b) => {
                                    const Poste1 = a.Poste;
                                    const Poste2 = b.Poste;

                                    if (Poste1 < Poste2) {
                                        return -1;
                                    } else if (Poste1 > Poste2) {
                                        return 1;
                                    } else {
                                        return 0;
                                    }
                                });
                                that.getView().byId('title').setText(`${that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("titleTable")} (${oData.results.length})`)
                                that.getView().byId("table").setModel(jModel);
                                oDialog.close();
                            }
                        },
                        error: function (oError) {
                            console.log('******************************************************** ERROR MSEG CALL ');
                            console.log(oError);
                            alert('Error reading data from backend system ! ')
                        }
                    })

                }, { passive: true });


            },
            onExtractDataJS: function () {
                const oDialog = this.getView().byId("BusyDialog");
                oDialog.open();
                const oSmartTableFilter = this.getView().byId("smartFilterBar");
                const oTable = this.getView().byId('table')
                const oBinding = oTable.getBinding("rows");
                let dataType = "application/vnd.ms-excel";
                // Hidden Link
                const aId = this.createId("hiddenLink")
                let aHyperlink = document.getElementById(aId)
                // Get filters
                const sArticle = oSmartTableFilter.getFilterData().Article;
                const sGrpMarchandise = oSmartTableFilter.getFilterData().GrpMarchandise;
                const sDivision = oSmartTableFilter.getFilterData().Division;
                const sMVT = oSmartTableFilter.getFilterData().MVT;
                const sDateComptable = oSmartTableFilter.getFilterData().DateComptable;

                // Check filters
                if (!sGrpMarchandise && !sDateComptable) {
                    MessageToast.show("Aucun des filtres obligatoires n'a été sélectionné.")
                    oDialog.close();
                    return;
                }

                // Get the values of filters
                let oArticle = []
                sArticle && sArticle.items.map((e) => e.text).map((x) => { oArticle.push(x) })

                let oGrpMarchandise = []
                sGrpMarchandise && sGrpMarchandise.items.map((e) => e.text).map((x) => { oGrpMarchandise.push(x) })

                let oDivision = []
                sDivision && sDivision.items.map((e) => e.text).map((x) => { oDivision.push(x) })

                let oMVT = []
                sMVT && sMVT.items.map((e) => e.text).map((x) => { oMVT.push(x) })

                let oDateComptable = {}
                if (sDateComptable) {
                    oDateComptable.min = sDateComptable.low
                    oDateComptable.max = sDateComptable.high
                }

                // Check if data is bound
                if (oBinding && oBinding.getLength() > 0) {
                    // console.log(oBinding.oList);
                    // debugger
                    const htmlCode = this._onGetHTMLCodeOfExcel(oArticle, oGrpMarchandise, oDivision, oMVT, oDateComptable, oBinding.oList)
                    // const blobHtml = new Blob(['Hello world'],  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                    // console.log(blobHtml);
                    // aHyperlink.href = window.URL.createObjectURL(blobHtml);
                    // // Setting the file name
                    aHyperlink.href = `data:${dataType}, ${htmlCode}`;
                    aHyperlink.download = `Extraction-${this._formatDate(new Date())}.xls`;
                    // //triggering the function
                    aHyperlink.click();
                    oDialog.close()
                } else {
                    // No data is bound
                    MessageToast.show("No data bound ")
                    oDialog.close();
                    return;
                }

            },
            onNavigateMM03: function (oEvent) {
                // alert('MM03')
                const oArticle = oEvent.getSource().getText()
                // console.log(typeof oArticle);
                const xnavservice = sap.ushell && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation")
                const href = (xnavservice && xnavservice.hrefForExternal({
                    target: {
                        semanticObject: 'Material',
                        action: 'display'
                    },
                    params: { "Material": oArticle }
                })) || ""
                // xnavservice.toExternal({ target: { shellHash: href } });

                const url = window.location.href.split('#')[0] + href;
                sap.m.URLHelper.redirect(url, true);

                // var url = window.location.href.split('#')[0] + hash;
                // sap.m.URLHelper.redirect(url, true);

            },
            onNavigateF1077: function (oEvent) {
                const oMaterialDocument = oEvent.getSource().getText()
                // console.log(typeof oArticle);
                const xnavservice = sap.ushell && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation")
                const href = (xnavservice && xnavservice.hrefForExternal({
                    target: {
                        semanticObject: 'MaterialDocument',
                        action: 'displayFactSheet'
                    },
                    params: { "MaterialDocument": oMaterialDocument }
                })) || ""
                // xnavservice.toExternal({ target: { shellHash: href } });

                const url = window.location.href.split('#')[0] + href;
                sap.m.URLHelper.redirect(url, true);
            },
            onNavigateBMBC: function (oEvent) {
                // alert('BMBC')
                const xnavservice = sap.ushell && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation")
                const href = (xnavservice && xnavservice.hrefForExternal({
                    target: {
                        semanticObject: 'Batch',
                        action: 'monitor'
                    }
                })) || ""
                // xnavservice.toExternal({ target: { shellHash: href } });

                const url = window.location.href.split('#')[0] + href;
                sap.m.URLHelper.redirect(url, true);
            },
            onNavigateMSC3N: function (oEvent) {
                const oCharg = oEvent.getSource().getText()

                const xnavservice = sap.ushell && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation")
                const href = (xnavservice && xnavservice.hrefForExternal({
                    target: {
                        semanticObject: 'Batch',
                        action: 'display'
                    },
                    params: {
                        "Batch": oCharg
                    }
                })) || ""
                // xnavservice.toExternal({ target: { shellHash: href } });

                const url = window.location.href.split('#')[0] + href;
                sap.m.URLHelper.redirect(url, true);
            },
            onNavigateME23N: function (oEvent) {
                const oPurDoc = oEvent.getSource().getText()

                const xnavservice = sap.ushell && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation")
                const href = (xnavservice && xnavservice.hrefForExternal({
                    target: {
                        semanticObject: 'ZSO_ZTRCME23N',
                        action: 'display'
                    },
                    params: {
                        "Ebeln": oPurDoc
                    }
                })) || ""
                // xnavservice.toExternal({ target: { shellHash: href } });

                const url = window.location.href.split('#')[0] + href;
                sap.m.URLHelper.redirect(url, true);
            },
            _onGetFilters: function (sFieldValue, sFieldName) {
                if (sFieldName == 'DateComptable') {
                    console.log(sFieldValue);
                    const oFilterBT = new Filter(sFieldName, FilterOperator.BT, sFieldValue.low, sFieldValue.high);
                    return oFilterBT;
                } else {
                    const oFilterEq = new Filter(sFieldName, FilterOperator.EQ, sFieldValue);
                    return oFilterEq;
                }
            },
            _formatDate: function (oDate) {
                if (!oDate) {
                    return "";
                }

                const oDateFormat = DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" });
                return oDateFormat.format(new Date(oDate));
            },
            _formatNumber: function (oNum, int, dec) {

                var result = (oNum - Math.floor(oNum)) !== 0;
                // debugger
                let oFormatOptions = {}
                oFormatOptions = {
                    minIntegerDigits: 1,
                    maxIntegerDigits: int,
                    minFractionDigits: dec,
                    maxFractionDigits: dec
                }

                var oFloatFormat = NumberFormat.getFloatInstance(oFormatOptions);


                let formattedNumber = oFloatFormat.format(Number(oNum))


                return formattedNumber
            },
            _formatUQVar: function (oNum) {
                // Create a NumberFormat instance with the desired formatting options
                var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                    style: "short",
                    shortDecimals: 1
                });

                // Format the number using the NumberFormat instance
                var formattedNumber = oNumberFormat.format(oNum);

                // Log the formatted number to the console
                return formattedNumber;
            },
            _onGetHTMLCodeOfExcel: function (fArticle, fGrp, fDivision, fMVT, fDate, fData) {
                // Access the resource bundle
                const oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle()
                // debugger
                // Get the title from the resource bundle
                const title = oResourceBundle.getText("title");
                const date = this._formatDate(new Date())
                const p1 = oResourceBundle.getText("para");
                // HTML
                let htmlCode = `<div id="allfile">
                                    <div class="container">
                                    <h3>${title}</h3>
                                    <p style="margin-bottom: 5px;"><b>Date&nbsp;:</b>&nbsp;${date}</p>
                                    <p style="margin-bottom: 0;  margin-top: 0px">${p1}</p>
                                    <ul style="margin-top: 3px;">
                                        <li><strong>Article&nbsp;:</strong>${fArticle.length > 0 ? fArticle.join(',') : 'Aucun'}</li>
                                        <li><strong>Groupe de marchandise&nbsp;:</strong>${fGrp.length > 0 ? fGrp.join(',') : 'Aucun'}</li>
                                        <li><strong>Division&nbsp;:</strong>${fDivision.length > 0 ? fDivision.join(',') : 'Aucun'}</li>
                                        <li><strong>Code MVT&nbsp;:</strong>${fMVT.length > 0 ? fMVT.join(',') : 'Aucun'}</li>
                                        <li><strong>Date Comptable&nbsp;:</strong>Du&nbsp;${this._formatDate(fDate.min)}&nbsp;Au&nbsp;${this._formatDate(fDate.max)}</li>
                                    </ul>
                                    </div>
                                    <table id="customersTable" style="font-family:arial, sans-serif;border: 1px solid black; border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                        <th style="width: 10em; border: 1px solid black;">Article</th>
                                        <th style="width: 15em; border: 1px solid black;">Description article</th>
                                        <th style="width: 15em; border: 1px solid black;">Groupe de marchandise</th>
                                        <th style="width: 20em; border: 1px solid black;">Description groupe de marchandise</th>
                                            <th style="width: 10em; border: 1px solid black;">Division</th>
                                            <th style="width: 10em; border: 1px solid black;">Magasin</th>
                                            <th style="width: 10em; border: 1px solid black;">MVT</th>
                                            <th style="width: 10em; border: 1px solid black;">Document article</th>
                                            <th style="width: 10em; border: 1px solid black;">Document d'achat</th>
                                            <th style="width: 10em; border: 1px solid black;">Poste</th>
                                            <th style="width: 10em; border: 1px solid black;">Date comptable</th>
                                            <th style="width: 10em; border: 1px solid black;">${oResourceBundle.getText("QteEnUQS")}</th>
                                            <th style="width: 10em; border: 1px solid black;">UQ de saisie</th>
                                            <th style="width: 15em; border: 1px solid black;">Qte unite de base (UQ)</th>
                                            <th style="width: 10em; border: 1px solid black;">UQ de base</th>
                                            <th style="width: 10em; border: 1px solid black;">UQ var</th>
                                            <th style="width: 10em; border: 1px solid black;">Lot fournisseur</th>
                                            <th style="width: 20em; border: 1px solid black;">${oResourceBundle.getText("LotQualite")}</th>
                                            
                                            <th style="width: 10em; border: 1px solid black;">Montant achat</th>
                                            <th style="width: 10em; border: 1px solid black;">Devise</th>
                                            <th style="width: 10em; border: 1px solid black;">${oResourceBundle.getText("Quantite")}</th>
                                            <th style="width: 10em; border: 1px solid black;">Client</th>
                                            <th style="width: 10em; border: 1px solid black;">Nom du client</th>
                                            <th style="width: 10em; border: 1px solid black;">Fournisseur</th>
                                            
                                        </tr>
                                    </thead>
                                    <tbody>
                                   
                                            ${fData && fData.map((e) => {
                    return (
                        `<tr>
                                                            <td style="border: 1px solid black;text-align:center;">${e.Article}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.DescriptionArticle}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.GrpMarchandise}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.DescGrpMarchandise}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.Division}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.Magasin}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.MVT}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.NumeroDoc}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.CdeAch}</td>   
                                                            <td style="border: 1px solid black;text-align:center;">${e.Poste}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.DateComptable}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.QteEnUQS}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.UQDeSaisie}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.QteEnUQ}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.UQDeBase}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.UQVar}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.LotFournisseur}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.LotQualite}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.MontantAchat}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.Devise}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.Quantite}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.ZClient}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.NomClient}</td>
                                                            <td style="border: 1px solid black;text-align:center;">${e.Fournisseur}</td>
                                                                                                                     
                                                        </tr>`
                    )
                }).join('')
                    }
                                            
                                            
                                 
                                    </tbody>
                                    </table>
                                </div>
                                `


                let fullHTML = `
                <!DOCTYPE html>
                <html lang="en">
                
                <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="X-UA-Compatible" content="IE=edge">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>ss</title>
                </head>
                <body>
                    ${htmlCode}
                </body>
                </html>
                `

                htmlCode = fullHTML.replace(/ /g, "%20");
                return htmlCode
            },
            onClearAllFilters: function () {
                // Get the table
                const oTable = this.byId("table");
                const oListBinding = oTable.getBinding();
                // Clear selection
                oTable.clearSelection();
               
                if (oListBinding) {
                    oListBinding.aSorters = null;
                    oListBinding.aFilters = null;
                }

                for (let iColCounter = 0; iColCounter < oTable.getColumns().length; iColCounter++) {
                    oTable.getColumns()[iColCounter].setSorted(false);
                    oTable.getColumns()[iColCounter].setFilterValue("");
                    oTable.getColumns()[iColCounter].setFiltered(false);
                }

                // Update Binding
                // Remove any filters
                oListBinding.filter([]);
            }
        });
    });
