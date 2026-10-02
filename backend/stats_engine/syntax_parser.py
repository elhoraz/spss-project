import re
from typing import List, Dict, Any
from .descriptives import compute_descriptives
from .frequencies import compute_frequencies
from .crosstabs import compute_crosstabs
from .correlations import compute_correlations
from .t_tests import compute_one_sample_t_test, compute_independent_t_test, compute_paired_t_test
from .anova import compute_one_way_anova
from .regression import compute_linear_regression

def parse_and_execute_syntax(syntax_text: str, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Parses and executes standard SPSS syntax commands.
    Supported commands:
    - DESCRIPTIVES
    - FREQUENCIES
    - CROSSTABS
    - CORRELATIONS
    - T-TEST (One-sample, Independent, Paired)
    - ONEWAY / ANOVA
    - REGRESSION
    """
    results = []
    # Split commands by period followed by whitespace or newline
    raw_commands = re.split(r'\.\s*(?:\r?\n|$)', syntax_text.strip())

    for cmd_str in raw_commands:
        cmd = cmd_str.strip()
        if not cmd or cmd.startswith('*') or cmd.startswith('/*'):
            continue

        upper_cmd = cmd.upper()

        try:
            # 1. FREQUENCIES
            if upper_cmd.startswith("FREQUENCIES") or upper_cmd.startswith("FREQ"):
                # Example: FREQUENCIES VARIABLES=salary educ
                var_match = re.search(r'VARIABLES?\s*=\s*([^/\.]+)', cmd, re.IGNORECASE)
                if var_match:
                    vars_list = var_match.group(1).replace(',', ' ').split()
                    res = compute_frequencies(data, vars_list)
                    results.append(res)

            # 2. DESCRIPTIVES
            elif upper_cmd.startswith("DESCRIPTIVES") or upper_cmd.startswith("DESCRIPT"):
                # Example: DESCRIPTIVES VARIABLES=salary salbegin educ
                var_match = re.search(r'VARIABLES?\s*=\s*([^/\.]+)', cmd, re.IGNORECASE)
                if var_match:
                    vars_list = var_match.group(1).replace(',', ' ').split()
                    res = compute_descriptives(data, vars_list)
                    results.append(res)

            # 3. CROSSTABS
            elif upper_cmd.startswith("CROSSTABS") or upper_cmd.startswith("CROSSTAB"):
                # Example: CROSSTABS /TABLES=gender BY jobcat
                table_match = re.search(r'TABLES?\s*=\s*(\w+)\s+BY\s+(\w+)', cmd, re.IGNORECASE)
                if table_match:
                    r_var = table_match.group(1).strip()
                    c_var = table_match.group(2).strip()
                    res = compute_crosstabs(data, r_var, c_var)
                    results.append(res)

            # 4. CORRELATIONS
            elif upper_cmd.startswith("CORRELATIONS") or upper_cmd.startswith("CORR"):
                # Example: CORRELATIONS /VARIABLES=salary salbegin educ
                var_match = re.search(r'VARIABLES?\s*=\s*([^/\.]+)', cmd, re.IGNORECASE)
                method = "pearson"
                if "SPEARMAN" in upper_cmd:
                    method = "spearman"
                elif "KENDALL" in upper_cmd:
                    method = "kendall"

                if var_match:
                    vars_list = var_match.group(1).replace(',', ' ').split()
                    res = compute_correlations(data, vars_list, method=method)
                    results.append(res)

            # 5. T-TEST
            elif upper_cmd.startswith("T-TEST") or upper_cmd.startswith("TTEST"):
                # Check for One-Sample: /TESTVAL=val /VARIABLES=var
                testval_match = re.search(r'TESTVAL\s*=\s*([0-9\.\-]+)', cmd, re.IGNORECASE)
                var_match = re.search(r'VARIABLES?\s*=\s*([^/\.]+)', cmd, re.IGNORECASE)
                grp_match = re.search(r'GROUPS?\s*=\s*(\w+)(?:\(([^)]+)\))?', cmd, re.IGNORECASE)
                pairs_match = re.search(r'PAIRS?\s*=\s*(\w+)\s+WITH\s+(\w+)', cmd, re.IGNORECASE)

                if pairs_match:
                    v1 = pairs_match.group(1).strip()
                    v2 = pairs_match.group(2).strip()
                    res = compute_paired_t_test(data, [[v1, v2]])
                    results.append(res)
                elif testval_match and var_match:
                    val = float(testval_match.group(1))
                    vars_list = var_match.group(1).replace(',', ' ').split()
                    res = compute_one_sample_t_test(data, vars_list, test_value=val)
                    results.append(res)
                elif grp_match and var_match:
                    g_var = grp_match.group(1)
                    vars_list = var_match.group(1).replace(',', ' ').split()
                    g_vals = grp_match.group(2)
                    g1, g2 = None, None
                    if g_vals:
                        tokens = [t.strip().strip("'\"") for t in g_vals.split()]
                        if len(tokens) >= 2:
                            g1, g2 = tokens[0], tokens[1]
                    res = compute_independent_t_test(data, vars_list, g_var, g1, g2)
                    results.append(res)

            # 6. ONEWAY / ANOVA
            elif upper_cmd.startswith("ONEWAY") or upper_cmd.startswith("ANOVA"):
                # Example: ONEWAY salary BY jobcat /POSTHOC=TUKEY
                match = re.search(r'(?:ONEWAY|ANOVA)\s+(\w+)\s+BY\s+(\w+)', cmd, re.IGNORECASE)
                if match:
                    dep = match.group(1)
                    factor = match.group(2)
                    post_hoc = "POSTHOC" in upper_cmd or "TUKEY" in upper_cmd
                    res = compute_one_way_anova(data, dep, factor, run_post_hoc=post_hoc)
                    results.append(res)

            # 7. REGRESSION
            elif upper_cmd.startswith("REGRESSION"):
                # Example: REGRESSION /DEPENDENT salary /METHOD=ENTER salbegin educ
                dep_match = re.search(r'DEPENDENT\s+(\w+)', cmd, re.IGNORECASE)
                indep_match = re.search(r'METHOD\s*=\s*ENTER\s+([^/\.]+)', cmd, re.IGNORECASE)
                if not indep_match:
                    indep_match = re.search(r'VARIABLES?\s*=\s*([^/\.]+)', cmd, re.IGNORECASE)

                if dep_match and indep_match:
                    dep = dep_match.group(1)
                    indeps = indep_match.group(1).replace(',', ' ').split()
                    res = compute_linear_regression(data, dep, indeps)
                    results.append(res)

            else:
                results.append({
                    "title": "Syntax Execution Warning",
                    "type": "warning",
                    "message": f"Command not recognized or unsupported: {cmd}"
                })
        except Exception as e:
            results.append({
                "title": "Syntax Execution Error",
                "type": "error",
                "command": cmd,
                "message": str(e)
            })

    return results
