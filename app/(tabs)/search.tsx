// app/(tabs)/search.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { addRecent } from "../../src/history";
import { AGE_GROUPS, evaluateManualProduct, fetchProductByBarcode, type ProductEval } from "../../src/logic";
import { colors, radius, spacing, typography } from "../../src/theme";
import AppButton from "../../src/ui/AppButton";
import AppText from "../../src/ui/AppText";
import ProfileHeader from "../../src/ui/ProfileHeader";
import SectionCard from "../../src/ui/SectionCard";
import SettingsButton from "../../src/ui/SettingsButton";
import { useTabBarPadding } from "../../src/ui/tabBarInset";
import { MANUAL_CATALOG, type ManualCategory, type ManualProduct } from "../../src/manualCatalog";

const NUMUM_LOGO = require("../../assets/images/NuMum_Logo Kopie.png");
const LOGO_SIZE = 120;
const LOGO_TOP_MARGIN = spacing.lg;
const BUTTON_TOP_MARGIN = LOGO_TOP_MARGIN + spacing.xs;

type BreadcrumbItem = {
  label: string;
  depth: number;
};

export default function ManualSearchScreen() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProductEval | null>(null);
  const [categoryPath, setCategoryPath] = useState<ManualCategory[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const bottomPad = useTabBarPadding(spacing.lg);
  const inputRef = useRef<TextInput>(null);

  const currentCategory = categoryPath[categoryPath.length - 1] ?? null;
  const currentCategories = currentCategory
    ? currentCategory.children ?? []
    : MANUAL_CATALOG;
  const currentProducts = currentCategory?.products ?? [];
  const isLeaf = !currentCategory?.children?.length && currentProducts.length > 0;

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { label: "Alle Kategorien", depth: 0 },
      ...categoryPath.map((node, idx) => ({ label: node.title, depth: idx + 1 })),
    ],
    [categoryPath]
  );

  const currentDescription = useMemo(() => {
    if (!currentCategory) {
      return "Stöbere durch alphabetisch sortierte Kategorien, um Produkte ohne Barcode zu finden.";
    }
    if (isLeaf) {
      return `Produkte in \"${currentCategory.title}\".`;
    }
    return `Unterkategorien von ${currentCategory.title}.`;
  }, [currentCategory, isLeaf]);

  async function onSubmit() {
    const code = barcode.trim();
    if (!code || busy) return;

    setBusy(true);
    setResult(null);
    try {
      const data = await fetchProductByBarcode(code);
      if (!data) {
        setResult(null);
        return;
      }
      await addRecent({
        id: code,
        name: data.productName ?? "Unbenannt",
        brand: data.brand ?? null,
        imageUrl: data.imageUrl ?? null,
        suitable: data.suitable ?? null,
      });
      setResult(data);
      setSelectedProductId(null);
    } finally {
      setBusy(false);
    }
  }

  function handleCategorySelect(item: ManualCategory) {
    if (item.children && item.children.length) {
      setCategoryPath((prev) => [...prev, item]);
      setSelectedProductId(null);
      return;
    }
    if (item.products && item.products.length) {
      setCategoryPath((prev) => [...prev, item]);
      setSelectedProductId(null);
    }
  }

  function handleBreadcrumbPress(depth: number) {
    if (depth === categoryPath.length) return;
    setCategoryPath((prev) => prev.slice(0, depth));
    setSelectedProductId(null);
  }

  function handleProductSelect(product: ManualProduct) {
    const nutrition = product.nutrition;
    const titles = [...categoryPath.map((node) => node.title)];
    const evaluation = evaluateManualProduct({
      productName: product.name,
      brand: product.brand,
      category: titles[titles.length - 1],
      categoryPath: titles,
      nutrition,
      description: product.description,
      ingredientsText: product.ingredients,
    });

    setResult(evaluation);
    setSelectedProductId(product.id);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: 0,
          paddingBottom: bottomPad,
          gap: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        <View style={{ paddingTop: LOGO_TOP_MARGIN, marginBottom: spacing.sm }}>
          <View pointerEvents="none" style={{ alignItems: "center" }}>
            <Image
              source={NUMUM_LOGO}
              style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
              resizeMode="contain"
            />
          </View>
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: BUTTON_TOP_MARGIN,
              left: spacing.lg,
              right: spacing.lg,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.sm,
            }}
          >
            <View style={{ width: 40, height: 40 }} />
            <SettingsButton onPress={() => router.push("/(tabs)/profile")} />
          </View>
        </View>

        <ProfileHeader
          title="Manuelle Suche"
          subtitle="Gib den Barcode ein oder wähle eine Kategorie."
          icon="search"
          showAvatar={false}
        />

        <SectionCard
          title="Barcode-Eingabe"
          items={[
            {
              content: (
                <View style={{ gap: spacing.sm }}>
                  <View style={{ gap: spacing.xs }}>
                    <AppText type="p3" muted>Barcode</AppText>
                    <TextInput
                      ref={inputRef}
                      value={barcode}
                      onChangeText={setBarcode}
                      placeholder="z. B. 4006381333931"
                      inputMode="numeric"
                      keyboardType="number-pad"
                      returnKeyType="search"
                      onSubmitEditing={onSubmit}
                      editable={!busy}
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 12,
                        fontSize: typography.p1.fontSize,
                        lineHeight: typography.p1.lineHeight,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <AppButton title={busy ? "Suchen…" : "Suchen"} onPress={onSubmit} disabled={busy} />
                    <AppButton title="Leeren" onPress={() => setBarcode("")} variant="ghost" disabled={busy} />
                  </View>

                  {busy ? (
                    <View style={{ alignItems: "center" }}>
                      <ActivityIndicator />
                      <AppText type="p3" muted style={{ marginTop: 6 }}>
                        Produktdaten werden geladen…
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ),
            },
          ]}
        />

        <SectionCard
          title="Lebensmittel nach Kategorie"
          items={[
            {
              content: (
                <View style={{ gap: spacing.md }}>
                  <BreadcrumbTrail breadcrumbs={breadcrumbs} onPress={handleBreadcrumbPress} />
                  <AppText type="p3" muted>
                    {currentDescription}
                  </AppText>

                  {currentCategories.length ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                      {currentCategories.map((category) => (
                        <CategoryCard key={category.id} category={category} onPress={handleCategorySelect} />
                      ))}
                    </View>
                  ) : null}

                  {isLeaf && currentProducts.length ? (
                    <ProductCardList
                      products={currentProducts}
                      selectedId={selectedProductId}
                      onSelect={handleProductSelect}
                    />
                  ) : null}
                </View>
              ),
            },
          ]}
        />

        {result && (
          <SectionCard
            title="Letztes Ergebnis"
            items={[
              {
                content: <EvaluationSummary result={result} />,
              },
            ]}
          />
        )}
      </ScrollView>
    </View>
  );
}

function BreadcrumbTrail({
  breadcrumbs,
  onPress,
}: {
  breadcrumbs: BreadcrumbItem[];
  onPress: (depth: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs }}>
      {breadcrumbs.map((crumb, index) => {
        const isActive = index === breadcrumbs.length - 1;
        return (
          <View
            key={`${crumb.label}-${crumb.depth}`}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <TouchableOpacity
              disabled={isActive}
              onPress={() => onPress(crumb.depth)}
              hitSlop={8}
            >
              <AppText type="p3" style={{ color: isActive ? colors.text : colors.primary_600 }}>
                {crumb.label}
              </AppText>
            </TouchableOpacity>
            {index < breadcrumbs.length - 1 ? (
              <AppText type="p3" muted>
                ›
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function CategoryCard({
  category,
  onPress,
}: {
  category: ManualCategory;
  onPress: (category: ManualCategory) => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Kategorie ${category.title}`}
      onPress={() => onPress(category)}
      style={{
        width: "47%",
        minWidth: 140,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.primary_50,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <AppText type="h3">{category.icon}</AppText>
      <AppText type="p2" style={{ color: colors.text }}>
        {category.title}
      </AppText>
      <View style={{ alignItems: "flex-end" }}>
        <Feather name="chevron-right" size={18} color={colors.primary_600} />
      </View>
    </TouchableOpacity>
  );
}

function ProductCardList({
  products,
  selectedId,
  onSelect,
}: {
  products: ManualProduct[];
  selectedId: string | null;
  onSelect: (product: ManualProduct) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText type="p3b" style={{ color: colors.text }}>
        Produkte ({products.length})
      </AppText>
      <View style={{ gap: spacing.sm }}>
        {products.map((product) => {
          const active = product.id === selectedId;
          return (
            <TouchableOpacity
              key={product.id}
              onPress={() => onSelect(product)}
              style={{
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: active ? colors.primary_600 : colors.border,
                backgroundColor: active ? colors.primary_100 : "#fff",
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                gap: spacing.xs,
              }}
            >
              <AppText type="p2" style={{ color: colors.text }}>
                {product.name}
              </AppText>
              {product.brand ? (
                <AppText type="p3" muted>
                  {product.brand}
                </AppText>
              ) : null}
              {product.description ? (
                <AppText type="p3" muted numberOfLines={2}>
                  {product.description}
                </AppText>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <AppText type="p3" muted>
        Tippe auf ein Produkt, um die Bewertung für 6–36 Monate und über 36 Monate zu sehen.
      </AppText>
    </View>
  );
}

function EvaluationSummary({ result }: { result: ProductEval }) {
  const activeEval = result.ageEvaluations[result.defaultAgeGroup];
  const statusColor = activeEval.suitable ? colors.primary_700 : colors.secondary_700;
  const statusText = activeEval.suitable ? "Geeignet" : "Nicht geeignet";
  const statusBg = activeEval.suitable ? colors.primary_100 : colors.secondary_100;
  const statusIcon: React.ComponentProps<typeof Feather>["name"] = activeEval.suitable ? "check-circle" : "x-circle";

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.pill,
            backgroundColor: statusBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={statusIcon} size={28} color={statusColor} />
        </View>
        <AppText type="h2" style={{ color: statusColor }}>
          {statusText}
        </AppText>
        <AppText type="p2" style={{ color: colors.text }}>
          {result.productName || "Unbenannt"}
          {result.brand ? ` · ${result.brand}` : ""}
        </AppText>
      </View>

      {(["infant", "older"] as Array<keyof typeof AGE_GROUPS>).map((ageKey) => {
        const evaluation = result.ageEvaluations[ageKey];
        if (!evaluation) return null;
        const color = evaluation.suitable ? colors.primary_600 : colors.secondary_700;
        const bg = evaluation.suitable ? colors.primary_100 : colors.secondary_100;
        const icon: React.ComponentProps<typeof Feather>["name"] = evaluation.suitable ? "check-circle" : "x-circle";
        return (
          <View key={ageKey} style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.pill,
                  backgroundColor: bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={icon} size={18} color={color} />
              </View>
              <AppText type="p2b" style={{ color }}>
                {AGE_GROUPS[ageKey].label}
              </AppText>
            </View>
            {evaluation.reasons.length ? (
              <View style={{ paddingLeft: 40, gap: spacing.xs }}>
                {evaluation.reasons.map((reason, idx) => (
                  <AppText key={idx} type="p3">
                    • {reason}
                  </AppText>
                ))}
              </View>
            ) : (
              <AppText type="p3" style={{ paddingLeft: 40 }}>
                Keine kritischen Hinweise.
              </AppText>
            )}
          </View>
        );
      })}

      <View style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        backgroundColor: "#fff",
        gap: spacing.xs,
      }}>
        <AppText type="p3b" style={{ color: colors.text }}>
          Nährwerte je 100 g/ml
        </AppText>
        <AppText type="p3">Energie: {result.nutrition.kcal ?? "–"} kcal</AppText>
        <AppText type="p3">Zucker: {result.nutrition.sugars ?? "–"} g</AppText>
        <AppText type="p3">Fett: {result.nutrition.fat ?? "–"} g</AppText>
        <AppText type="p3">Salz: {result.nutrition.salt ?? "–"} g</AppText>
      </View>
    </View>
  );
}
