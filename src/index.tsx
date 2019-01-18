import {
  appendCellToNotebook,
  createCodeCell,
  emptyNotebook,
  fromJS,
  ImmutableCodeCell,
  ImmutableNotebook
} from "@nteract/commutable";
import {
  DisplayData,
  ExecuteResult,
  KernelOutputError,
  Media,
  Output,
  StreamText
} from "@nteract/outputs";
import {
  Cell,
  Cells,
  Input,
  Outputs,
  Prompt,
  Source,
  themes
} from "@nteract/presentational-components";
import { OutputType } from "@nteract/records";
import * as React from "react";
import { BlockMath, InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import katex from "rehype-katex";
import stringify from "rehype-stringify";
import math from "remark-math";
import remark2rehype from "remark-rehype";
import styled, { createGlobalStyle } from "styled-components";

interface Props {
  displayOrder: string[];
  notebook: ImmutableNotebook;
  transforms: object;
  theme: "light" | "dark";
}

interface State {
  notebook: ImmutableNotebook;
}

const ContentMargin = styled.div`
  padding-left: calc(var(--prompt-width, 50px) + 10px);
  padding-top: 10px;
  padding-bottom: 10px;
  padding-right: 10px;
`;

const RawCell = styled.pre`
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 10px,
    #efefef 10px,
    #f1f1f1 20px
  );
`;

const Themes = {
  dark: createGlobalStyle`
    :root {
      ${themes.dark}
    }`,
  light: createGlobalStyle`
    :root {
      ${themes.light}
    }`
};

export default class NotebookRender extends React.PureComponent<Props, State> {
  static defaultProps = {
    notebook: appendCellToNotebook(
      emptyNotebook,
      createCodeCell().set("source", "# where's the content?")
    ),
    theme: "light"
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      notebook: fromJS(props.notebook)
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.notebook !== this.props.notebook) {
      this.setState({ notebook: fromJS(nextProps.notebook) });
    }
  }

  render() {
    const notebook = this.state.notebook;

    // Propagated from the hide_(all)_input nbextension
    const allSourceHidden = notebook.getIn(["metadata", "hide_input"]) || false;

    const language =
      notebook.getIn([
        "metadata",
        "language_info",
        "codemirror_mode",
        "name"
      ]) ||
      notebook.getIn(["metadata", "language_info", "codemirror_mode"]) ||
      notebook.getIn(["metadata", "language_info", "name"]) ||
      "text";

    const cellOrder = notebook.get("cellOrder");
    const cellMap = notebook.get("cellMap");

    return (
      <div className="notebook-render">
        <Cells>
          {cellOrder.map((cellId: string) => {
            const cell = cellMap.get(cellId);
            const cellType: string = cell!.get("cell_type");
            const source = cell!.get("source");

            switch (cellType) {
              case "code":
                const sourceHidden =
                  allSourceHidden ||
                  cell!.getIn(["metadata", "inputHidden"]) ||
                  cell!.getIn(["metadata", "hide_input"]);

                const outputHidden =
                  (cell as ImmutableCodeCell).get("outputs").size === 0 ||
                  cell!.getIn(["metadata", "outputHidden"]);

                return (
                  <Cell key={cellId}>
                    <Input hidden={sourceHidden}>
                      <Prompt
                        counter={(cell as ImmutableCodeCell).get(
                          "execution_count"
                        )}
                      />
                      <Source language={language} theme={this.props.theme}>
                        {source}
                      </Source>
                    </Input>
                    <Outputs
                      hidden={outputHidden}
                      expanded={
                        cell!.getIn(["metadata", "outputExpanded"]) || true
                      }
                    >
                      {cell!
                        .get("outputs")
                        .toJS()
                        .map((output: OutputType, index: number) => (
                          <Output output={output} key={index}>
                            <DisplayData>
                              <Media.HTML />
                              <Media.Image />
                              <Media.Json />
                              <Media.JavaScript />
                              <Media.LaTeX />
                              <Media.Markdown />
                              <Media.Plain />
                              <Media.SVG />
                            </DisplayData>

                            <ExecuteResult>
                              <Media.HTML />
                              <Media.Image />
                              <Media.Json />
                              <Media.JavaScript />
                              <Media.LaTeX />
                              <Media.Markdown />
                              <Media.Plain />
                              <Media.SVG />
                            </ExecuteResult>
                            <KernelOutputError />
                            <StreamText />
                          </Output>
                        ))}
                    </Outputs>
                  </Cell>
                );
              case "markdown":
                const remarkPlugins = [math, remark2rehype, katex, stringify];
                const remarkRenderers = {
                  math: function blockMath(node: { value: string }) {
                    return <BlockMath>{node.value}</BlockMath>;
                  },
                  inlineMath: function inlineMath(node: { value: string }) {
                    return <InlineMath>{node.value}</InlineMath>;
                  }
                } as any;
                return (
                  <Cell key={cellId}>
                    <ContentMargin>
                      <ReactMarkdown
                        escapeHtml={false}
                        source={source}
                        plugins={remarkPlugins}
                        renderers={remarkRenderers}
                      />
                    </ContentMargin>
                  </Cell>
                );
              case "raw":
                return (
                  <Cell key={cellId}>
                    <RawCell>{source}</RawCell>
                  </Cell>
                );

              default:
                return (
                  <Cell key={cellId}>
                    <Outputs>
                      <pre>{`Cell Type "${cellType}" is not implemented`}</pre>
                    </Outputs>
                  </Cell>
                );
            }
          })}
        </Cells>
        {this.props.theme === "dark" ? <Themes.dark /> : <Themes.light />}
      </div>
    );
  }
}
