import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';

import { IDigestCache, DigestCache } from '@microsoft/sp-http';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import styles from './ChangesFormWebPart.module.scss';
import * as strings from 'ChangesFormWebPartStrings';

export interface IChangesFormWebPartProps {
  description: string;
}

export default class ChangesFormWebPart extends BaseClientSideWebPart<IChangesFormWebPartProps> {

  //private _isDarkTheme: boolean = false;
  //private _environmentMessage: string = '';

  private itemID: string | null = null;

  public render(): void {

    const params = new URLSearchParams(window.location.search);

    this.itemID = params.get('orderid');

    if (this.itemID) {

      this.domElement.innerHTML = `
      <div id="${styles.COForm}">
      <div id="${styles.COFormContainer}">
        <div id="${styles.COFormLeft}">
          <div id="${styles.COFormLeftTitle}">Change Order Details</div>
          <div id="COFormLeftDetails"></div>
        </div>
        <div id="${styles.COFormRight}">
          <div id="${styles.TasksContainer}">
            <div id="${styles.TasksTitle}">Change Tasks</div>
            <div id="${styles.TasksDetails}"></div>
            <div id="${styles.NewTask}">
              <div><input type="text" id="${styles.NewTaskTitle}"></input></div>
              <div><select id="${styles.NewTaskAssignedTo}"></select></div>
              <div><input type="checkbox" id="NewTaskCompleted"></input></div>
            </div>
            <div><button id="NewTaskButton">Add Task</button></div>
          </div>
          <div id="${styles.EventsContainer}">
            <div id="${styles.EventsTitle}">Change Events</div>
            <div id="${styles.EventsDetails}"></div>
            <div id="${styles.NewEvent}">
            <div><input type="text" id="${styles.NewEventTitle}"></input></div>
            <div><input type="datetime-local" id="${styles.NewEventStartDate}"></input></div>
            <div><input type="datetime-local" id="${styles.NewEventEndDate}"></input></div>
          </div>
          <div><button id="NewEventButton">Add Event</button></div>
          </div>
        </div>
      </div>
      <div id="${styles.COFormButtonContainer}"><div><button id="frmClose">Close</button></div><div id="${styles.changelink}"></div></div>
      <div>
        <a href="https://fastsharepoint.com/templatehelp">Get the code or help.</a>
      </div>
      </div>
      `;

      const myHeaders = new Headers({
        'Accept': 'application/json; odata=verbose'
      })
      
      const myInit = { 
        method: 'GET',
        headers: myHeaders
      }
  
      fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Orders')/items(${this.itemID})?$select=ID,Title,FSChangeOrderStatus,FSChangeOrderPriority,FSChangeOrderApproval,FSChangeOrderProject,FSChangeOrderDateofChange,FSChangeOrderDescriptionofChange,FSChangeOrderReasonforChange,FSChangeOrderImpactonSchedule,FSChangeOrderCostImpact,FSChangeOrderApprover/Title,Author/Title&$expand=FSChangeOrderApprover/Id,Author/Id`, myInit).then((response) => {
        response.json().then((data) => {
          const COFormleftDetails = document.getElementById(`COFormLeftDetails`);
          if (COFormleftDetails) {
            const changeDate = new Date(data.d.FSChangeOrderDateofChange);
            COFormleftDetails.innerHTML = `
            <div id="${styles.OrderTopDetails}">
              <div class="${styles.OrderTopDetailsRow}"><div class="single"><span>Change ID:</span> ${data.d.ID}</div></div>
              <div class="${styles.OrderTopDetailsRow}"><div class="single"><span>Title:</span> ${data.d.Title}</div></div>
              <div class="${styles.OrderTopDetailsRow}"><div class="single"><span>Project:</span> ${data.d.FSChangeOrderProject ? data.d.FSChangeOrderProject : ""}</div></div>
              <div class="${styles.OrderTopDetailsRow}"><div><span>Status:</span> ${data.d.FSChangeOrderStatus ? data.d.FSChangeOrderStatus : ""}</div><div><span>Priority:</span> ${data.d.FSChangeOrderPriority ? data.d.FSChangeOrderPriority : ""}</div></div>
              <div class="${styles.OrderTopDetailsRow}"><div><span>Change Date:</span> ${data.d.FSChangeOrderDateofChange ? changeDate.toLocaleDateString() : ""}</div><div><span>Approval:</span> ${data.d.FSChangeOrderApproval ? data.d.FSChangeOrderApproval : ""}</div></div>
              <div class="${styles.OrderTopDetailsRow}"><div><span>Approver:</span> ${data.d.FSChangeOrderApprover.Title ? data.d.FSChangeOrderApprover.Title : ""}</div><div><span>Author:</span> ${data.d.Author.Title ? data.d.Author.Title : ""}</div></div>
            </div>
            <div id="${styles.OrderBottomDetails}">
              <div class="${styles.OrderBottomDetailsLabel}">Description</div>
              <div class="${styles.OrderBottomDetailsValue}">${data.d.FSChangeOrderDescriptionofChange ? data.d.FSChangeOrderDescriptionofChange : ""}</div>
              <div class="${styles.OrderBottomDetailsLabel}">Change Reason</div>
              <div class="${styles.OrderBottomDetailsValue}">${data.d.FSChangeOrderReasonforChange ? data.d.FSChangeOrderReasonforChange : ""}</div>
              <div class="${styles.OrderBottomDetailsLabel}">Impact on Schedule</div>
              <div class="${styles.OrderBottomDetailsValue}">${data.d.FSChangeOrderImpactonSchedule ? data.d.FSChangeOrderImpactonSchedule : ""}</div>
              <div class="${styles.OrderBottomDetailsLabel}">Cost Impact</div>
              <div class="${styles.OrderBottomDetailsValue}">${data.d.FSChangeOrderCostImpact ? data.d.FSChangeOrderCostImpact : ""}</div>
            </div>
            `;

            this.getChangeTasks(data.d.ID);
            this.getChangeEvents(data.d.ID);

            this.setRelatedButtonClicks()

            const changelink = document.getElementById(`${styles.changelink}`);
            if (changelink)
              changelink.innerHTML=`<a href="${this.context.pageContext.web.absoluteUrl}/Lists/Change%20Orders/EditForm.aspx?ID=${data.d.ID}" target="_blank" rel="noopener noreferrer">Edit Change Order</a>`;

          }
        })
      })

      const closeButton = document.getElementById('frmClose');

      if (closeButton) {
        closeButton.addEventListener("click", function() {
          const params = new URLSearchParams(window.location.search);

          const returnurl: string | null = params.get('returnurl');

          if (returnurl) {
            window.location.href = returnurl;
          }

        });

      }
    }
  }

  protected setRelatedButtonClicks(): void {
    const myHeaders = new Headers({
      'Accept': 'application/json; odata=verbose'
    })
    
    const myInit = { 
      method: 'GET',
      headers: myHeaders
    }

    const base = this;
    const absoluteUrl = this.context.pageContext.web.absoluteUrl;

    const digestCache: IDigestCache = this.context.serviceScope.consume(DigestCache.serviceKey);
      digestCache.fetchDigest(this.context.pageContext.web.serverRelativeUrl).then((digest: string): void => {
        fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/siteusers`, myInit).then((response) => {
          response.json().then((data) => {
            const siteUsers = document.getElementById(`${styles.NewTaskAssignedTo}`);
            console.log(data);
            let selectOptions = `<option value=""></option>`;
            data.d.results.forEach((user: any) => {
              if (user.UserPrincipalName) {
                selectOptions += `<option value="${user.Id}">${user.Title}</option>`;
              }
            });
            if (siteUsers)
              siteUsers.innerHTML = selectOptions;
     
            document.getElementById('NewTaskButton')?.addEventListener("click", function(evt: any) {
              
              const titleEle = (<HTMLInputElement>document.getElementById(`${styles.NewTaskTitle}`));
              const assignedEle = (<HTMLInputElement>document.getElementById(`${styles.NewTaskAssignedTo}`));
              const completedEle = (<HTMLInputElement>document.getElementById("NewTaskCompleted"));
              
              if (titleEle.value) {
                const body = JSON.stringify(
                  {
                    "__metadata": {
                      "type": "SP.Data.Change_x0020_TasksListItem"
                    },
                    "FSChangeTaskChangeOrderId": base.itemID,
                    "Title": titleEle.value,
                    "FSChangeTaskAssignedId": assignedEle.value ? assignedEle.value : null,
                    "FSChangeTaskCompleted": completedEle.checked ? "true" : "false",
                  }
                )
      
                fetch(absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Tasks')/items`, {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json; odata=verbose',
                    'Content-Type': 'application/json; odata=verbose',
                    'Content-Length': body.length.toString(),
                    'X-RequestDigest': digest ? digest : "",
                    "IF-MATCH": "*",
                  },
                  body: body
                }).then(() => {
                  titleEle.value = "";
                  assignedEle.value = "";
                  completedEle.checked = false;

                  base.render(); 
                });
              }

            });
            
          })
        });


        document.getElementById('NewEventButton')?.addEventListener("click", function(evt: any) {
              
          const titleEle = (<HTMLInputElement>document.getElementById(`${styles.NewEventTitle}`));
          const startdateEle = (<HTMLInputElement>document.getElementById(`${styles.NewEventStartDate}`));
          const enddateEle = (<HTMLInputElement>document.getElementById(`${styles.NewEventEndDate}`));
          
          if (titleEle.value) {

            fetch(absoluteUrl + `/_api/Web/RegionalSettings/TimeZone`, myInit).then((response) => {
              response.json().then((data) => { 

                const webServerOffset = data.d.Information.Bias + data.d.Information.DaylightBias;
                const localOffset = new Date().getTimezoneOffset();
                let totalOffset = 0;

                if (webServerOffset > localOffset) {
                totalOffset = webServerOffset - localOffset;
                }
                else {
                totalOffset = localOffset - webServerOffset;
                }

                const startdate:any = new Date(startdateEle.value);
                const enddate:any = new Date(enddateEle.value);
                const startdateLocal = new Date(startdate.getTime() + totalOffset * 60000);
                const enddateLocal = new Date(enddate.getTime() + totalOffset * 60000);


                const body = JSON.stringify(
                  {
                    "__metadata": {
                      "type": "SP.Data.Change_x0020_EventsListItem"
                    },
                    "FSChangeEventChangeOrderId": base.itemID,
                    "Title": titleEle.value,
                    "FSChangeEventStartDate": startdateEle.value ? startdateLocal : null,
                    "FSChangeEventEndDate": enddateEle.value ? enddateLocal : null,
                  }
                )
      
                fetch(absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Events')/items`, {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json; odata=verbose',
                    'Content-Type': 'application/json; odata=verbose',
                    'Content-Length': body.length.toString(),
                    'X-RequestDigest': digest ? digest : "",
                    "IF-MATCH": "*",
                  },
                  body: body
                }).then(() => {
                  titleEle.value = "";
                  startdateEle.value = "";
                  enddateEle.value = "";

                  base.render();
                });

              })
            })

          }

        });

      });

  }

  protected getChangeTasks(id: string): void {
    
    const myHeaders = new Headers({
      'Accept': 'application/json; odata=verbose'
    })
    
    const myInit = { 
      method: 'GET',
      headers: myHeaders
    }

    fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Tasks')/items?$select=ID,Title,FSChangeTaskCompleted,FSChangeTaskAssigned/Title&$expand=FSChangeTaskAssigned/Id&$filter=FSChangeTaskChangeOrderId eq '${id}'`, myInit).then((response) => {
      response.json().then((data) => {
        
        const tasks = document.getElementById(`${styles.TasksDetails}`);

        if (tasks)
          tasks.innerHTML = "";

        const taskrow = document.createElement("div");
        taskrow.className = `${styles.taskrow} ${styles.taskrowheader}`;
        taskrow.innerHTML = `<div class="title">Title</div><div>Assigned To</div><div>Completed</div>`;
        if (tasks)
          tasks.appendChild(taskrow);

        if (data.d.results.length > 0) {
          data.d.results.forEach((datarow: any) => {
            const taskrow = document.createElement("div");
            taskrow.className = `${styles.taskrow}`;
            taskrow.innerHTML = `<div class="title"><a href="${this.context.pageContext.web.absoluteUrl}/Lists/Change%20Tasks/EditForm.aspx?ID=${datarow.ID}" target="_blank" rel="noopener noreferrer">${datarow.Title}</a></div><div>${datarow.FSChangeTaskAssigned.Title ? datarow.FSChangeTaskAssigned.Title : ""}</div><div>${datarow.FSChangeTaskCompleted}</div>`;

            if (tasks)
              tasks.appendChild(taskrow);
          });

        }
      })
    })

  }

  protected getChangeEvents(id: string): void {
    
    const myHeaders = new Headers({
      'Accept': 'application/json; odata=verbose'
    })
    
    const myInit = { 
      method: 'GET',
      headers: myHeaders
    }

    fetch(this.context.pageContext.web.absoluteUrl + `/_api/Web/RegionalSettings/TimeZone`, myInit).then((response) => {
      response.json().then((data) => { 

        const webServerOffset = data.d.Information.Bias + data.d.Information.DaylightBias;
        const localOffset = new Date().getTimezoneOffset();
        let totalOffset = 0;

        if (webServerOffset > localOffset) {
          totalOffset = webServerOffset - localOffset;
        }
        else {
          totalOffset = localOffset - webServerOffset;
        }
        
        fetch(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('Change%20Events')/items?$filter=FSChangeEventChangeOrderId eq '${id}'`, myInit).then((response) => {
          response.json().then((data) => {
            
            const events = document.getElementById(`${styles.EventsDetails}`);
            if (events) 
              events.innerHTML = "";
    
            const eventrow = document.createElement("div");
            eventrow.className = `${styles.eventrow}  ${styles.eventrowheader}`;
            eventrow.innerHTML = `<div class="title">Title</div><div>Start</div><div>End</div>`;
            if (events)
            events.appendChild(eventrow);

            if (data.d.results.length > 0) {
    
              data.d.results.forEach((datarow: any) => {
                const eventrow = document.createElement("div");
                eventrow.className = `${styles.eventrow}`;
                const startdate:any = new Date(datarow.FSChangeEventStartDate);
                const enddate:any = new Date(datarow.FSChangeEventEndDate);

                const startdateLocal = new Date(startdate - totalOffset * 60000);
                const enddateLocal = new Date(enddate - totalOffset * 60000);

                eventrow.innerHTML = `<div class="title"><a href="${this.context.pageContext.web.absoluteUrl}/Lists/Change%20Events/EditForm.aspx?ID=${datarow.ID}" target="_blank" rel="noopener noreferrer">${datarow.Title}</a></div><div>${datarow.FSChangeEventStartDate ? startdateLocal.toLocaleString() : ""}</div><div>${datarow.FSChangeEventEndDate ? enddateLocal.toLocaleString() : ""}</div>`;
                //eventrow.innerHTML = `<div class="title"><a href="${this.context.pageContext.web.absoluteUrl}/Lists/Change%20Events/EditForm.aspx?ID=${datarow.ID}" target="_blank">${datarow.Title}</a></div><div>${datarow.StartDate ? datarow.StartDate : ""}</div><div>${datarow.EndDate ? enddate.toLocaleDateString() + " " + enddate.toLocaleTimeString() : ""}</div>`;
    
                if (events)
                  events.appendChild(eventrow);
              });
    
            }
          })
        })

      })
    })



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
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
