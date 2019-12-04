import * as React from "react";
import { ImmutableNotebook } from "@nteract/commutable";
interface Props {
    displayOrder: string[];
    notebook: ImmutableNotebook;
    transforms: object;
    theme: "light" | "dark";
}
interface State {
    notebook: ImmutableNotebook;
}
export default class NotebookRender extends React.PureComponent<Props, State> {
    static defaultProps: {
        displayOrder: string[];
        notebook: ImmutableNotebook;
        theme: string;
        transforms: any;
    };
    constructor(props: Props);
    componentWillReceiveProps(nextProps: Props): void;
    render(): JSX.Element;
}
export {};
