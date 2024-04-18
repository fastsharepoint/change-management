import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
//import { escape } from '@microsoft/sp-lodash-subset';

import styles from './ChangesListWebPart.module.scss';
import * as strings from 'ChangesListWebPartStrings';

export interface IChangesListWebPartProps {
  description: string;
  displayformurl: string;
}

export default class ChangesListWebPart extends BaseClientSideWebPart<IChangesListWebPartProps> {

  //private _isDarkTheme: boolean = false;
 // private _environmentMessage: string = '';

  private currentTab: string = "AssignedToMe";
  private currentGrid: string = "AssignedToMeRowsContainer";

  public render(): void {
      this.domElement.innerHTML = `
      <div id="${styles.ListContainer}">
        <div id="${styles.TabsContainer}">
          <div id="AssignedToMe" class="${styles.tab}">Assigned To Me (0)</div>
          <div id="Unassigned" class="${styles.tab}">Unassigned (0)</div>
          <div id="Open" class="${styles.tab}">Open (0)</div>
          <div id="InReview" class="${styles.tab}">In Review (0)</div>
          <div id="Approved" class="${styles.tab}">Approved (0)</div>
          <div id="InProgress" class="${styles.tab}">In Progress (0)</div>
          <div id="Completed" class="${styles.tab}">Completed (0)</div>
          <div id="Rejected" class="${styles.tab}">Rejected (0)</div>
        </div>
        <div id="AssignedToMeRowsContainer" class="${styles.RowsContainer}">
        </div>
        <div id="UnassignedRowsContainer" class="${styles.RowsContainer}">
        </div>
        <div id="OpenRowsContainer" class="${styles.RowsContainer}">
        </div>
        <div id="InReviewRowsContainer" class="${styles.RowsContainer}">
        </div>        
        <div id="ApprovedRowsContainer" class="${styles.RowsContainer}">
        </div>        
        <div id="InProgressRowsContainer" class="${styles.RowsContainer}">
        </div>
        <div id="CompletedRowsContainer" class="${styles.RowsContainer}">
        </div>
        <div id="RejectedRowsContainer" class="${styles.RowsContainer}">
        </div>                   
      </div>
      <div>
        <a href="https://fastsharepoint.com/templatehelp">Get the code or help.</a>
      </div>
      `;
      
      const tabs = document.getElementsByClassName(styles.tab);

      if (tabs) {

        const parent = this;

        Array.prototype.forEach.call(tabs, function(tab: Element, index: any) {
          tab.addEventListener("click", function() {
            const tabs = document.getElementsByClassName(`${styles.tab}`);

            if (tabs) {
              Array.prototype.forEach.call(tabs, function(grid: Element, index: any) {
                grid.className = `${styles.tab}`;
              });
            }
            
            this.className = `${styles.tab} ${styles.active}`;

            parent.currentTab = `${this.id}`;

            const grids = document.getElementsByClassName(`${styles.RowsContainer}`);

            if (grids) {
              Array.prototype.forEach.call(grids, function(grid: Element, index: any) {
                grid.className = `${styles.RowsContainer}`;
              });
            }
            
            const currentGrid = document.getElementById(`${this.id}RowsContainer`);
            if (currentGrid) {
              currentGrid.className = `${styles.RowsContainer} ${styles.show}`;
            }

            parent.currentGrid = `${this.id}RowsContainer`;
          });
        }, parent);

      }

      const firstTab = document.getElementById(this.currentTab);
      if (firstTab)
        firstTab.className = `${styles.tab} ${styles.active}`;

      const firstGrid = document.getElementById(this.currentGrid);
      if (firstGrid)
        firstGrid.className = `${styles.RowsContainer} ${styles.show}`;
    
      this.getChangesAssigned("AssignedToMe", "Assigned To Me");
      this.getChangesUnAssigned("Unassigned", "Unassigned");
      this.getChangesByStatus("Open", "Open", "Open");
      this.getChangesByStatus("InReview", "In Review", "In Review");
      this.getChangesByApproval("Approved", "Approved", "Approved");
      this.getChangesByStatus("InProgress", "In Progress", "In Progress");
      this.getChangesByStatus("Completed", "Completed", "Completed");
      this.getChangesByApproval("Rejected", "Rejected", "Rejected");
      
  }

  protected getChangesAssigned(id: string, label: string) : void {
    
    const tab = document.getElementById(id);

    if (tab != null) {
      const myHeaders = new Headers({
        'Accept': 'application/json; odata=verbose'
      })
      
      const myInit = { 
        method: 'GET',
        headers: myHeaders
      }

      fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/currentUser`, myInit).then((userresponse) => {
        userresponse.json().then((currentuser) => { 

          fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Orders')/items?$select=ID,Title,FSChangeOrderStatus,FSChangeOrderPriority,FSChangeOrderApproval,FSChangeOrderApprover/Title,Author/Title&$expand=FSChangeOrderApprover/Id,Author/Id&$filter=FSChangeOrderApproverId eq ${currentuser.d.Id}`, myInit).then((response) => {
            response.json().then((data) => {
              tab.innerHTML = label + ` (${data.d.results.length})`;
              const grid = document.getElementById(`${tab.id}RowsContainer`);

              if (grid)
                grid.innerHTML = "";

              if (data.d.results.length > 0) {
                const header = document.createElement("div");
                header.className = `${styles.row} ${styles.header}`
                header.innerHTML = `<div class="${styles.id}">ID</div><div class="${styles.title}">Title</div><div>Prority</div><div>Status</div><div>Approval</div><div>Approver</div><div>Author</div>`;
                if (grid)
                  grid.appendChild(header);
              }
              else {
                const header = document.createElement("div");
                header.innerHTML = `No rows`;
                if (grid)
                  grid.appendChild(header);
              }
              data.d.results.forEach((datarow: any) => {
                this.buildGridRow(datarow, grid);
              });
    
            })
          })

        })
      })
    }
  }

  protected getChangesByStatus(id: string, label: string, status: string) : void {
    
    const tab = document.getElementById(id);

    if (tab != null) {
      const myHeaders = new Headers({
        'Accept': 'application/json; odata=verbose'
      })
      
      const myInit = { 
        method: 'GET',
        headers: myHeaders
      }

      fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Orders')/items?$select=ID,Title,FSChangeOrderStatus,FSChangeOrderPriority,FSChangeOrderApproval,FSChangeOrderApprover/Title,Author/Title&$expand=FSChangeOrderApprover/Id,Author/Id&$filter=FSChangeOrderStatus eq '${status}'`, myInit).then((response) => {
        response.json().then((data) => {
          tab.innerHTML = label + ` (${data.d.results.length})`;
          const grid = document.getElementById(`${tab.id}RowsContainer`);

          if (grid)
            grid.innerHTML = "";

          if (data.d.results.length > 0) {
            const header = document.createElement("div");
            header.className = `${styles.row} ${styles.header}`
            header.innerHTML = `<div class="${styles.id}">ID</div><div class="${styles.title}">Title</div><div>Prority</div><div>Status</div><div>Approval</div><div>Approver</div><div>Author</div>`;
            if (grid)
              grid.appendChild(header);
          }
          else {
            const header = document.createElement("div");
            header.innerHTML = `No rows`;
            if (grid)
              grid.appendChild(header);
          }
          data.d.results.forEach((datarow: any) => {
            this.buildGridRow(datarow, grid);
          });
          
        })
      })
    }
  }

  protected getChangesByApproval(id: string, label: string, approval: string) : void {
    
    const tab = document.getElementById(id);

    if (tab != null) {
      const myHeaders = new Headers({
        'Accept': 'application/json; odata=verbose'
      })
      
      const myInit = { 
        method: 'GET',
        headers: myHeaders
      }

      fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Orders')/items?$select=ID,Title,FSChangeOrderStatus,FSChangeOrderPriority,FSChangeOrderApproval,FSChangeOrderApprover/Title,Author/Title&$expand=FSChangeOrderApprover/Id,Author/Id&$filter=FSChangeOrderApproval eq '${approval}'`, myInit).then((response) => {
        response.json().then((data) => {
          tab.innerHTML = label + ` (${data.d.results.length})`;
          const grid = document.getElementById(`${tab.id}RowsContainer`);

          if (grid)
            grid.innerHTML = "";

          if (data.d.results.length > 0) {
            const header = document.createElement("div");
            header.className = `${styles.row} ${styles.header}`
            header.innerHTML = `<div class="${styles.id}">ID</div><div class="${styles.title}">Title</div><div>Prority</div><div>Status</div><div>Approval</div><div>Approver</div><div>Author</div>`;
            if (grid)
              grid.appendChild(header);
          }
          else {
            const header = document.createElement("div");
            header.innerHTML = `No rows`;
            if (grid)
              grid.appendChild(header);
          }

          data.d.results.forEach((datarow: any) => {
            this.buildGridRow(datarow, grid);
          });
          
        })
      })
    }
  }

  protected getChangesUnAssigned(id: string, label: string) : void {
    
    const tab = document.getElementById(id);

    if (tab != null) {
      const myHeaders = new Headers({
        'Accept': 'application/json; odata=verbose'
      })
      
      const myInit = { 
        method: 'GET',
        headers: myHeaders
      }

      fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Orders')/items?$select=ID,Title,FSChangeOrderStatus,FSChangeOrderPriority,FSChangeOrderApproval,FSChangeOrderApprover/Title,Author/Title&$expand=FSChangeOrderApprover/Id,Author/Id&$filter=FSChangeOrderApproverId eq null`, myInit).then((response) => {
        response.json().then((data) => {
          tab.innerHTML = label + ` (${data.d.results.length})`;
          const grid = document.getElementById(`${tab.id}RowsContainer`);
          
          if (grid)
            grid.innerHTML = "";

          if (data.d.results.length > 0) {
            const header = document.createElement("div");
            header.className = `${styles.row} ${styles.header}`
            header.innerHTML = `<div class="${styles.id}">ID</div><div class="${styles.title}">Title</div><div>Prority</div><div>Status</div><div>Approval</div><div>Approver</div><div>Author</div>`;
            if (grid)
              grid.appendChild(header);
          }
          else {
            const header = document.createElement("div");
            header.innerHTML = `No rows`;
            if (grid)
              grid.appendChild(header);
          }
          data.d.results.forEach((datarow: any) => {
            this.buildGridRow(datarow, grid);
          });

        })
      })
    }
  }

  protected buildGridRow(datarow: any, grid: HTMLElement | null) : void {

    const elerow = document.createElement("div");
    elerow.className = styles.row;

    let priorityClass = "";
    switch(datarow.FSChangeOrderPriority) {
      case 'Low':
        priorityClass = "low";
      case 'Medium':
        priorityClass = "medium";
      break;
      case 'High':
        priorityClass = "high";
      break;
      default:
    }

    elerow.innerHTML = `<div class="${styles.col} ${styles.id}">${datarow.ID}</div><div class="${styles.col} ${styles.title}"><a href="${this.properties.displayformurl}?orderid=${datarow.ID}&returnurl=${window.location.href}" class="change" data-id=${datarow.ID}>${datarow.Title}</a></div><div class="${styles.col}"><div class=${priorityClass}>${datarow.FSChangeOrderPriority ? datarow.FSChangeOrderPriority : "Not Set"}</div></div><div class="${styles.col}">${datarow.FSChangeOrderStatus ? datarow.FSChangeOrderStatus : "Not Set"}</div><div class="${styles.col}">${datarow.FSChangeOrderApproval ? datarow.FSChangeOrderApproval : "Not Set"}</div><div class="${styles.col}">${datarow.FSChangeOrderApprover.Title ? datarow.FSChangeOrderApprover.Title : "Not Set"}</div><div class="${styles.col}">${datarow.Author.Title}</div>`;

    if (grid)
      grid.appendChild(elerow);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      //this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    //this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('displayformurl', {
                  label: strings.DisplayFormUrl
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
