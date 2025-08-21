import get from 'lodash/get';
import filter from 'lodash/filter';
import { formBuilderConstants } from 'form-builder/constants';
import ReactHtmlParser from 'react-html-parser';

export default class FormHelper {
  static getFormResourceControls(formData) {
    if (formData) {
      const { resources } = formData;
      const formResources = filter(resources,
        (resource) => resource.dataType === formBuilderConstants.formResourceDataType);
      const valueAsString = get(formResources, ['0', 'value']);
      return (valueAsString && JSON.parse(valueAsString).controls) || [];
    }
    return [];
  }

  static validateFormName(formName) {
    const pattern = /^[^\.\/\-\^\s][^\.\/\-\^]*$/;
    return pattern.test(formName);
  }

  static processEventsUnescapedHtml(control) {
    if (control && control.events && control.type === 'obsControl' && control.events !== undefined) {
      let eventKeys = Object.keys(control.events);
      eventKeys.forEach(eventKey => {
        const script = control.events[eventKey];
        if (script && script !== undefined && script.length > 0) {
          const scriptModed = ReactHtmlParser(script, {decodeEntities: true});
          control.events[eventKey] = (scriptModed && scriptModed !== undefined && scriptModed.length > 0) ? scriptModed.at(0) : script;
        }
      });
    }
    return control ? control.events : {};
  }

  static getObsControlEvents(control) {
    let obsControlEvents = [];
    if (control && control.type === 'obsControl' && control.concept !== undefined) {
      obsControlEvents = obsControlEvents.concat({
        id: control.id, name: control.concept.name, events: this.processEventsUnescapedHtml(control)
      });
    } else if (control && control.controls !== undefined) {
      const childControls = control.controls;
      const obsControls = childControls.filter(ctrl => ctrl && ctrl.type === 'obsControl');
      const nonObscontrols = childControls.filter(ctrl => ctrl && ctrl.type !== 'obsControl');
      nonObscontrols.forEach(ctrl => {
        if (ctrl.controls !== undefined) {
          const childObsControlEvents = this.getObsControlEvents(ctrl);
          if (childObsControlEvents && childObsControlEvents.length > 0) {
            obsControlEvents = obsControlEvents.concat(childObsControlEvents);
          }
        }
      });
      obsControls.forEach(ctrl => {
        obsControlEvents.push({ id: ctrl.id, name: ctrl.concept.name, events: this.processEventsUnescapedHtml(ctrl) })
      });
    }
    return obsControlEvents;
  }
}
