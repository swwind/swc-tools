use std::collections::HashSet;

use regex::Regex;
use serde::Deserialize;
use swc_core::ecma::ast::{
    CallExpr, Id, Ident, ImportNamedSpecifier, KeyValueProp, Lit, MethodProp, ModuleExportName,
    Prop, PropName, PropOrSpread,
};
use swc_core::ecma::visit::VisitMutWith;
use swc_core::ecma::{ast::Program, visit::VisitMut};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

#[derive(Deserialize)]
struct TreeshakeEventsConfig {
    #[serde(default = "default_jsxs")]
    jsxs: Vec<String>,
    #[serde(default = "default_matches")]
    matches: Vec<String>,
}

fn default_jsxs() -> Vec<String> {
    vec![
        String::from("jsx"),
        String::from("jsxs"),
        String::from("jsxDEV"),
    ]
}

fn default_matches() -> Vec<String> {
    vec![String::from("^on[A-Z]")]
}

impl Default for TreeshakeEventsConfig {
    fn default() -> Self {
        Self {
            jsxs: default_jsxs(),
            matches: default_matches(),
        }
    }
}

pub struct TreeshakeEventsVisitor {
    jsxs: HashSet<String>,
    matches: Vec<Regex>,
    jsxs_ids: HashSet<Id>,
}

impl TreeshakeEventsVisitor {
    fn from_config(config: TreeshakeEventsConfig) -> Self {
        Self {
            jsxs: config.jsxs.into_iter().collect(),
            matches: config
                .matches
                .into_iter()
                .map(|x| Regex::new(&x).unwrap())
                .collect(),
            jsxs_ids: HashSet::new(),
        }
    }

    fn is_jsx(&self, ident: &Ident) -> bool {
        self.jsxs.contains(&ident.sym.to_string())
    }

    fn is_jsx_id(&self, ident: &Ident) -> bool {
        self.jsxs_ids.contains(&ident.to_id())
    }

    fn should_remove(&self, ident: &Ident) -> bool {
        let name = ident.sym.to_string();
        self.matches.iter().any(|regex| regex.is_match(&name))
    }
}

impl Default for TreeshakeEventsVisitor {
    fn default() -> Self {
        Self::from_config(TreeshakeEventsConfig::default())
    }
}

impl VisitMut for TreeshakeEventsVisitor {
    fn visit_mut_import_named_specifier(&mut self, n: &mut ImportNamedSpecifier) {
        if let Some(ModuleExportName::Ident(ident)) = &n.imported {
            if self.is_jsx(ident) {
                self.jsxs_ids.insert(n.local.to_id());
            }
        } else if self.is_jsx(&n.local) {
            self.jsxs_ids.insert(n.local.to_id());
        }
    }

    fn visit_mut_call_expr(&mut self, n: &mut CallExpr) {
        if let Some(expr) = n.callee.as_expr() {
            if let Some(ident) = expr.as_ident() {
                // is jsx() function call
                if self.is_jsx_id(&ident) && n.args.len() >= 2 {
                    // check first argument is string literal
                    let ty = &n.args[0];
                    if matches!(ty.expr.as_lit(), Some(Lit::Str(_))) {
                        // modify second argument's properties
                        let prop = &mut n.args[1];
                        if let Some(obj) = prop.expr.as_mut_object() {
                            obj.props.retain(|x| match x {
                                PropOrSpread::Prop(p) => match p.as_ref() {
                                    Prop::Shorthand(id) => !self.should_remove(&id),
                                    Prop::KeyValue(KeyValueProp {
                                        key: PropName::Ident(id),
                                        ..
                                    }) => !self.should_remove(&id),
                                    Prop::Method(MethodProp {
                                        key: PropName::Ident(id),
                                        ..
                                    }) => !self.should_remove(&id),
                                    _ => true,
                                },
                                _ => true,
                            })
                        }
                    }
                }
            }
        }

        n.visit_mut_children_with(self);
    }
}

#[plugin_transform]
pub fn process_transform(
    mut program: Program,
    metadata: TransformPluginProgramMetadata,
) -> Program {
    let config = metadata
        .get_transform_plugin_config()
        .and_then(|x| serde_json::from_str::<TreeshakeEventsConfig>(&x).ok())
        .unwrap_or_default();

    program.visit_mut_with(&mut TreeshakeEventsVisitor::from_config(config));

    program
}

#[cfg(test)]
mod test {
    use swc_core::ecma::{transforms::testing::test_inline, visit::as_folder};

    use crate::TreeshakeEventsVisitor;

    test_inline!(
        Default::default(),
        |_| as_folder(TreeshakeEventsVisitor::default()),
        should_remove_events,
        r#"
        import { jsx } from "preact/jsx-runtime";
        jsx("div", { onClick: () => console.log(23333) });
        "#,
        r#"
        import { jsx } from "preact/jsx-runtime";
        jsx("div", {});
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(TreeshakeEventsVisitor::default()),
        should_remove_events_in_method,
        r#"
        import { jsx } from "preact/jsx-runtime";
        jsx("div", { onClick() { console.log(23333) } });
        "#,
        r#"
        import { jsx } from "preact/jsx-runtime";
        jsx("div", {});
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(TreeshakeEventsVisitor::default()),
        should_remove_events_rename,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", { onClick: () => console.log(23333) });
        "#,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", {});
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(TreeshakeEventsVisitor::default()),
        should_not_effect_normal_function,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        jsx("div", { onClick: () => console.log(114514) });
        _jsx("div", { onClick: () => console.log(1919810) });
        "#,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        jsx("div", { onClick: () => console.log(114514) });
        _jsx("div", {});
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(TreeshakeEventsVisitor::default()),
        should_not_effect_non_intristic_elements,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", { onClick: () => console.log(1919810) });
        _jsx(App, { onClick: () => console.log(114514) });
        "#,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", {});
        _jsx(App, { onClick: () => console.log(114514) });
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(TreeshakeEventsVisitor::default()),
        should_not_effect_normal_properties,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", { id: "app", onClick: () => console.log(1919810) });
        "#,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", { id: "app" });
        "#
    );

    test_inline!(
        Default::default(),
        |_| as_folder(TreeshakeEventsVisitor::default()),
        should_work_recursively,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", {
            id: "app",
            onClick: () => console.log(1919810),
            children: [
                _jsx("p", { id: "p", onClick: () => alert(114514) }),
                _jsx("span", { id: "span", onClick: () => alert(23333) }),
            ]
        });
        "#,
        r#"
        import { jsx as _jsx } from "preact/jsx-runtime";
        _jsx("div", {
            id: "app",
            children: [
                _jsx("p", { id: "p" }),
                _jsx("span", { id: "span" }),
            ]
        });
        "#
    );
}
