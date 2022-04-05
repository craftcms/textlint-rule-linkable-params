const DEFAULT_OPTIONS = {
  terms: ["id"],
};

export default function (context, opts = {}) {
  const { Syntax, RuleError, report, getSource } = context;
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const terms = options.terms;

  /**
   * Get parents of node.
   * The parent nodes are returned in order from the closest parent to the outer ones.
   * @param node
   * @returns {Array}
   */
  function getParents(node) {
    const result = [];
    // child node has `parent` property.
    let parent = node.parent;
    while (parent != null) {
      result.push(parent);
      parent = parent.parent;
    }
    return result;
  }

  /**
   * Return true if `node` is wrapped any one of `types`.
   * @param {TxtNode} node is target node
   * @param {string[]} types are wrapped target node
   * @returns {boolean|*}
   */
  function isNodeWrapped(node, types) {
    const parents = getParents(node);
    const parentsTypes = parents.map(function (parent) {
      return parent.type;
    });
    return types.some(function (type) {
      return parentsTypes.some(function (parentType) {
        return parentType === type;
      });
    });
  }

  function getRegexForTerm(term) {
    return new RegExp(`${term}`);
  }

  return {
    [Syntax.Str](node) {
      terms.forEach((term) => {
        const text = getSource(node); // Get text
        const regex = getRegexForTerm(term);
        const matches = regex.exec(text);

        if (!matches) {
          return;
        }

        // allow this if it’s wrapped in a link or code block
        if (isNodeWrapped(node, [Syntax.Link, Syntax.Code])) {
          return;
        }

        const indexOfTerm = matches.index;
        const ruleError = new RuleError(
          `Found term “${term}”, use “${term.toUpperCase()}” instead.`,
          {
            index: indexOfTerm, // padding of index
          }
        );
        report(node, ruleError);
      });
    },
  };
}
